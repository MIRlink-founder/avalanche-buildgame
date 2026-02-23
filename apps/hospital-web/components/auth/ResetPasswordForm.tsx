'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Label } from '@mire/ui/components/label';
import { Separator } from '@mire/ui/components/separator';
import { AlertCircle, CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';

type RequestResponse = {
  success: boolean;
  mailSent: boolean;
  resetLink?: string;
};

type ConfirmResponse = {
  success: boolean;
};

type Step = 'request' | 'sent' | 'reset' | 'complete';

function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);
  return hasLetter && hasNumber && hasSpecial;
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [step, setStep] = useState<Step>(tokenParam ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState(tokenParam);
  const [resetLink, setResetLink] = useState('');
  const [mailSent, setMailSent] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [samePasswordError, setSamePasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    if (tokenParam) {
      setStep('reset');
      setResetToken(tokenParam);
      setSubmitError('');
    }
  }, [tokenParam]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const passwordValid = useMemo(() => isValidPassword(password), [password]);
  const passwordMatch = useMemo(
    () => password.length > 0 && password === passwordConfirm,
    [password, passwordConfirm],
  );
  const canReset =
    passwordValid && passwordMatch && !isSubmitting && !samePasswordError;
  const samePasswordCheckRef = useRef(0);
  const samePasswordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastCheckedPasswordRef = useRef('');

  const checkSamePassword = async (value: string) => {
    if (!resetToken) return;
    const trimmed = value.trim();
    if (!trimmed || !isValidPassword(trimmed)) {
      setSamePasswordError(false);
      return;
    }

    const checkId = samePasswordCheckRef.current + 1;
    samePasswordCheckRef.current = checkId;

    try {
      const response = await fetch('/api/auth/reset-password/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: value }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        same?: boolean;
      };

      if (samePasswordCheckRef.current !== checkId) return;
      if (!response.ok) {
        setSamePasswordError(false);
        return;
      }

      setSamePasswordError(Boolean(data.same));
    } catch (error) {
      if (samePasswordCheckRef.current === checkId) {
        setSamePasswordError(false);
      }
      console.error(error);
    }
  };

  const scheduleSamePasswordCheck = (value: string) => {
    if (samePasswordTimeoutRef.current) {
      clearTimeout(samePasswordTimeoutRef.current);
    }
    const trimmed = value.trim();
    if (!trimmed || !isValidPassword(trimmed)) {
      setSamePasswordError(false);
      return;
    }

    samePasswordTimeoutRef.current = setTimeout(() => {
      if (lastCheckedPasswordRef.current === value) return;
      lastCheckedPasswordRef.current = value;
      void checkSamePassword(value);
    }, 350);
  };

  useEffect(() => {
    if (!resetToken) return;
    if (!passwordValid) {
      if (samePasswordTimeoutRef.current) {
        clearTimeout(samePasswordTimeoutRef.current);
      }
      setSamePasswordError(false);
      return;
    }

    scheduleSamePasswordCheck(password);

    return () => {
      if (samePasswordTimeoutRef.current) {
        clearTimeout(samePasswordTimeoutRef.current);
      }
    };
  }, [password, passwordValid, resetToken]);

  const handleCheckEmail = async () => {
    if (!email) {
      setEmailError('이메일을 입력해주세요');
      setEmailChecked(null);
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('이메일 형식을 확인해주세요');
      setEmailChecked(null);
      return;
    }

    setIsSubmitting(true);
    setEmailError('');
    setSubmitError('');

    try {
      const response = await fetch(
        `/api/auth/check-email?email=${encodeURIComponent(email)}`,
      );
      const data = (await response.json().catch(() => ({}))) as {
        exists?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setEmailError(data.error || '이메일 확인 중 오류가 발생했습니다');
        setEmailChecked(null);
        return;
      }

      if (data.exists) {
        setEmailChecked(true);
      } else {
        setEmailChecked(false);
      }
    } catch (error) {
      console.error(error);
      setEmailError('이메일 확인 중 오류가 발생했습니다');
      setEmailChecked(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestReset = async () => {
    if (!emailChecked) {
      setEmailError('아이디 확인을 먼저 진행해주세요');
      return;
    }

    setIsSubmitting(true);
    setEmailError('');
    setSubmitError('');

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json().catch(() => ({}))) as
        | RequestResponse
        | { error?: string };

      if (!response.ok || !(data as RequestResponse).success) {
        setEmailError(
          (data as { error?: string }).error ||
            '재설정 링크 발송에 실패했습니다',
        );
        return;
      }

      const payload = data as RequestResponse;
      setMailSent(payload.mailSent);
      setResetLink(payload.resetLink ?? '');
      setStep('sent');
    } catch (error) {
      console.error(error);
      setEmailError('재설정 링크 발송 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      setSubmitError('재설정 토큰이 필요합니다');
      return;
    }

    if (!passwordValid) {
      setSubmitError('영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.');
      setSamePasswordError(false);
      return;
    }

    if (!passwordMatch) {
      setSubmitError('비밀번호가 일치하지 않습니다.');
      setSamePasswordError(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSamePasswordError(false);

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      });

      const data = (await response.json().catch(() => ({}))) as
        | ConfirmResponse
        | { error?: string };

      if (!response.ok || !(data as ConfirmResponse).success) {
        const errorMessage =
          (data as { error?: string }).error ||
          '비밀번호 재설정에 실패했습니다';
        if (errorMessage.includes('기존 비밀번호')) {
          setSamePasswordError(true);
          return;
        }
        setSubmitError(errorMessage);
        return;
      }

      setStep('complete');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    } catch (error) {
      console.error(error);
      setSubmitError('비밀번호 재설정 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'complete') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">비밀번호 재설정 완료</h1>
            <p className="text-muted-foreground">
              새 비밀번호로 다시 로그인해주세요.
            </p>
          </div>
        </div>
        <Separator />
        <Link href="/">
          <Button size="xl" className="w-full">
            로그인으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="rounded-full bg-orange-100 p-4">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">비밀번호 재설정</h1>
            <p className="text-muted-foreground">새 비밀번호를 입력해주세요.</p>
          </div>
        </div>
        <Separator />
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void handleResetPassword();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="password">새 비밀번호 설정</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSubmitError('');
                  setSamePasswordError(false);
                }}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {password.length > 0 && (
              <p
                className={`flex items-center gap-1 text-sm ${
                  samePasswordError || !passwordValid
                    ? 'text-destructive'
                    : 'text-green-600'
                }`}
              >
                {samePasswordError ? (
                  <>
                    <XCircle className="h-4 w-4 shrink-0" />
                    기존에 사용하던 비밀번호는 사용할 수 없습니다.
                  </>
                ) : passwordValid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    사용 가능한 비밀번호입니다.
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 shrink-0" />
                    영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.
                  </>
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(event) => {
                  setPasswordConfirm(event.target.value);
                  setSubmitError('');
                }}
                placeholder="비밀번호 다시 입력"
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'
                }
              >
                {showPasswordConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordConfirm.length > 0 && (
              <p
                className={`flex items-center gap-1 text-sm ${
                  passwordMatch ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {passwordMatch ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    비밀번호가 일치합니다.
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 shrink-0" />
                    비밀번호가 일치하지 않습니다.
                  </>
                )}
              </p>
            )}
          </div>
          <Separator />
          {submitError && (
            <p className="flex items-center gap-1 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </p>
          )}
          <Button
            size="xl"
            type="submit"
            className="w-full"
            disabled={!canReset}
          >
            {isSubmitting ? '처리 중...' : '비밀번호 변경'}
          </Button>
        </form>
      </div>
    );
  }

  if (step === 'sent') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="rounded-full bg-primary-subtle p-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">재설정 링크 발송 완료</h1>
            <p className="text-muted-foreground">
              {mailSent
                ? '이메일로 재설정 링크를 발송했습니다. 메일을 확인해주세요.'
                : '메일 발송에 실패했습니다. 아래 버튼으로 재설정 페이지를 열어주세요.'}
            </p>
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          {!mailSent && resetLink && (
            <Button
              size="xl"
              className="w-full"
              onClick={() => {
                window.location.href = resetLink;
              }}
            >
              재설정 페이지 열기
            </Button>
          )}
          <Link
            href="/"
            className="block text-center text-sm text-muted-foreground underline"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-primary-subtle p-4">
          <AlertCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">비밀번호 재설정</h1>
          <p className="text-muted-foreground">
            아이디(이메일)를 확인한 뒤 재설정 링크를 발송합니다.
          </p>
        </div>
      </div>
      <Separator />
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void handleRequestReset();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailChecked(null);
                setEmailError('');
                setSubmitError('');
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckEmail}
              disabled={isSubmitting}
              className="h-12"
            >
              아이디 확인
            </Button>
          </div>
          {emailChecked === true && (
            <p className="text-sm text-green-600">가입된 이메일입니다.</p>
          )}
          {emailChecked === false && (
            <p className="text-sm text-destructive">
              가입된 이메일을 찾을 수 없습니다.
            </p>
          )}
          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
        </div>
        <Button
          size="xl"
          type="submit"
          className="w-full"
          disabled={isSubmitting || !emailChecked}
        >
          {isSubmitting ? '처리 중...' : '재설정 링크 발송'}
        </Button>
        <p className="text-xs text-muted-foreground">
          재설정 링크는 발송 후 1시간 동안만 유효합니다.
        </p>
        <Link
          href="/"
          className="block text-center text-sm text-muted-foreground underline"
        >
          로그인으로 돌아가기
        </Link>
      </form>
    </div>
  );
}
