'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Label } from '@mire/ui/components/label';

type RequestResponse = {
  success: boolean;
  mailSent: boolean;
  resetLink?: string;
};

type ConfirmResponse = {
  success: boolean;
};

type Step = 'request' | 'sent' | 'reset' | 'complete';

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
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    if (tokenParam) {
      setStep('reset');
      setResetToken(tokenParam);
    }
  }, [tokenParam]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다';
    }
    return '';
  };

  const isResetReady = useMemo(() => {
    if (!password || !passwordConfirm) {
      return false;
    }
    if (passwordError || confirmError) {
      return false;
    }
    return true;
  }, [confirmError, password, passwordConfirm, passwordError]);

  const handleCheckEmail = async () => {
    if (!email) {
      setEmailError('이메일을 입력해주세요');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('이메일 형식을 확인해주세요');
      setEmailChecked(false);
      return;
    }

    setIsSubmitting(true);
    setEmailError('');

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
        setEmailChecked(false);
        return;
      }

      if (data.exists) {
        setEmailChecked(true);
      } else {
        setEmailChecked(false);
        setEmailError('가입된 이메일을 찾을 수 없습니다');
      }
    } catch (error) {
      console.error(error);
      setEmailError('이메일 확인 중 오류가 발생했습니다');
      setEmailChecked(false);
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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordError(validation);
    if (passwordConfirm && value !== passwordConfirm) {
      setConfirmError('비밀번호가 일치하지 않습니다');
    } else {
      setConfirmError('');
    }
  };

  const handlePasswordConfirmChange = (value: string) => {
    setPasswordConfirm(value);
    if (password && value !== password) {
      setConfirmError('비밀번호가 일치하지 않습니다');
    } else {
      setConfirmError('');
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      setConfirmError('재설정 토큰이 필요합니다');
      return;
    }

    if (!isResetReady) {
      return;
    }

    setIsSubmitting(true);
    setConfirmError('');

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
        setConfirmError(
          (data as { error?: string }).error ||
            '비밀번호 재설정에 실패했습니다',
        );
        return;
      }

      setStep('complete');
    } catch (error) {
      console.error(error);
      setConfirmError('비밀번호 재설정 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'complete') {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">비밀번호 재설정 완료</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            새 비밀번호로 다시 로그인해주세요.
          </p>
        </div>
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
        <div>
          <h1 className="text-2xl font-semibold">비밀번호 재설정</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            새 비밀번호를 입력해주세요.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">새 비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => handlePasswordChange(event.target.value)}
            />
            {passwordError && (
              <p className="text-destructive text-sm">{passwordError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) =>
                handlePasswordConfirmChange(event.target.value)
              }
            />
            {confirmError && (
              <p className="text-destructive text-sm">{confirmError}</p>
            )}
          </div>
        </div>
        <Button
          size="xl"
          className="w-full"
          onClick={handleResetPassword}
          disabled={isSubmitting || !isResetReady}
        >
          {isSubmitting ? '처리 중...' : '비밀번호 변경'}
        </Button>
      </div>
    );
  }

  if (step === 'sent') {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">재설정 링크 발송 완료</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mailSent
              ? '이메일로 재설정 링크를 발송했습니다. 메일을 확인해주세요.'
              : '메일 발송에 실패했습니다. 아래 버튼으로 재설정 페이지를 열어주세요.'}
          </p>
        </div>
        {!mailSent && (
          <Button
            size="xl"
            className="w-full"
            onClick={() => {
              if (resetLink) {
                window.location.href = resetLink;
              }
            }}
          >
            재설정 페이지로 이동
          </Button>
        )}
        <Link href="/" className="text-muted-foreground text-sm underline">
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">비밀번호 재설정</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          아이디(이메일)를 확인한 뒤 재설정 링크를 발송합니다.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailChecked(null);
                setEmailError('');
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckEmail}
              disabled={isSubmitting}
            >
              아이디 확인
            </Button>
          </div>
          {emailChecked === true && (
            <p className="text-primary text-sm">가입된 이메일입니다.</p>
          )}
          {emailChecked === false && (
            <p className="text-destructive text-sm">
              가입된 이메일을 찾을 수 없습니다.
            </p>
          )}
          {emailError && (
            <p className="text-destructive text-sm">{emailError}</p>
          )}
        </div>
      </div>
      <Button
        size="xl"
        className="w-full"
        onClick={handleRequestReset}
        disabled={isSubmitting || !emailChecked}
      >
        {isSubmitting ? '처리 중...' : '재설정 링크 발송'}
      </Button>
      <Link href="/" className="text-muted-foreground text-sm underline">
        로그인으로 돌아가기
      </Link>
    </div>
  );
}
