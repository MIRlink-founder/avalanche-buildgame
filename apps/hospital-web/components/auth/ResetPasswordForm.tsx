'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Label } from '@mire/ui/components/label';
import { Separator } from '@mire/ui/components/separator';
import { AlertCircle, CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';
import { AlertModal } from '@/components/layout/AlertModal';

function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);
  return hasLetter && hasNumber && hasSpecial;
}

type ModalState = {
  open: boolean;
  message: string;
  primaryButton?: { label: string; onClick: () => void };
  secondaryButton?: { label: string; onClick: () => void };
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const hasToken = tokenParam.length > 0;

  // request step 상태
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // reset step 상태
  const [status, setStatus] = useState<'loading' | 'valid' | 'handled'>(
    'loading',
  );
  const [validatedEmail, setValidatedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [samePasswordError, setSamePasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // AlertModal 상태
  const [modal, setModal] = useState<ModalState>({ open: false, message: '' });

  // 기존 비밀번호 체크
  const samePasswordCheckRef = useRef(0);
  const samePasswordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastCheckedPasswordRef = useRef('');

  const passwordValid = useMemo(() => isValidPassword(password), [password]);
  const passwordMatch = useMemo(
    () => password.length > 0 && password === passwordConfirm,
    [password, passwordConfirm],
  );
  const canReset =
    passwordValid && passwordMatch && !isSubmitting && !samePasswordError;

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const goToLogin = () => router.push('/');

  // ---------- 토큰이 있으면 validate API 호출 ----------
  useEffect(() => {
    if (!hasToken) return;

    fetch(
      `/api/auth/reset-password/validate?token=${encodeURIComponent(tokenParam)}`,
    )
      .then((res) => res.json())
      .then(
        (data: {
          valid: boolean;
          reason?: string;
          email?: string;
        }) => {
          if (data.valid) {
            setStatus('valid');
            setValidatedEmail(data.email ?? '');
          } else if (data.reason === 'expired') {
            setStatus('handled');
            const expiredEmail = data.email ?? '';
            setModal({
              open: true,
              message: '인증 링크의 유효기간이 만료되었습니다.',
              primaryButton: {
                label: '메일 재발송',
                onClick: () => handleResendFromExpired(expiredEmail),
              },
            });
          } else {
            setStatus('handled');
            setModal({
              open: true,
              message: '유효하지 않은 링크입니다.',
              secondaryButton: { label: '확인', onClick: goToLogin },
            });
          }
        },
      )
      .catch(() => {
        setStatus('handled');
        setModal({
          open: true,
          message: '유효하지 않은 링크입니다.',
          secondaryButton: { label: '확인', onClick: goToLogin },
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam]);

  // ---------- 기존 비밀번호 중복 체크 ----------
  const checkSamePassword = async (value: string) => {
    if (!tokenParam) return;
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
        body: JSON.stringify({ token: tokenParam, password: value }),
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
    if (!tokenParam) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, passwordValid, tokenParam]);

  // ---------- 만료 토큰에서 메일 재발송 ----------
  const handleResendFromExpired = async (resendEmail: string) => {
    setModal({ open: false, message: '' });
    try {
      await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      setModal({
        open: true,
        message: '메일을 재발송하였습니다.\n메일함을 확인해주세요.',
        primaryButton: { label: '완료', onClick: goToLogin },
      });
    } catch {
      setModal({
        open: true,
        message: '메일 재발송에 실패했습니다.',
        secondaryButton: { label: '확인', onClick: goToLogin },
      });
    }
  };

  // ---------- request: 이메일로 초기화 링크 요청 ----------
  const handleRequestReset = async () => {
    if (!email.trim()) return;

    if (!validateEmail(email)) {
      setModal({
        open: true,
        message: '이메일 형식이 올바르지 않습니다.',
        secondaryButton: { label: '확인', onClick: () => setModal({ open: false, message: '' }) },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.status === 404) {
        setModal({
          open: true,
          message: '등록되지 않은 이메일입니다.',
          primaryButton: { label: '완료', onClick: goToLogin },
          secondaryButton: { label: '확인', onClick: () => setModal({ open: false, message: '' }) },
        });
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setModal({
          open: true,
          message: data.error ?? '요청 중 오류가 발생했습니다.',
          secondaryButton: { label: '확인', onClick: () => setModal({ open: false, message: '' }) },
        });
        return;
      }

      setModal({
        open: true,
        message: '메일이 전송 되었습니다.\n메일함을 확인해주세요.',
        primaryButton: { label: '완료', onClick: goToLogin },
      });
    } catch {
      setModal({
        open: true,
        message: '재설정 링크 발송 중 오류가 발생했습니다.',
        secondaryButton: { label: '확인', onClick: () => setModal({ open: false, message: '' }) },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- reset: 새 비밀번호 설정 ----------
  const handleResetPassword = async () => {
    if (!tokenParam || !canReset) return;

    setIsSubmitting(true);
    setSubmitError('');
    setSamePasswordError(false);

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenParam, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        const errorMessage = data.error ?? '비밀번호 초기화에 실패했습니다';
        if (errorMessage.includes('기존 비밀번호')) {
          setSamePasswordError(true);
          return;
        }
        if (
          errorMessage.includes('만료') ||
          errorMessage.includes('expired')
        ) {
          setModal({
            open: true,
            message: '토큰이 만료되었습니다.',
            primaryButton: { label: '완료', onClick: goToLogin },
          });
          return;
        }
        setSubmitError(errorMessage);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      setModal({
        open: true,
        message: '비밀번호가 변경되었습니다.\n다시 로그인해주세요.',
        primaryButton: { label: '완료', onClick: goToLogin },
      });
    } catch {
      setSubmitError('비밀번호 초기화 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== 토큰 있으면 reset step ==========
  if (hasToken) {
    if (status === 'loading') {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">확인 중...</p>
        </div>
      );
    }

    if (status === 'handled') {
      return (
        <AlertModal
          open={modal.open}
          onOpenChange={(open) => {
            if (!open) goToLogin();
          }}
          message={modal.message}
          primaryButton={modal.primaryButton}
          secondaryButton={modal.secondaryButton}
        />
      );
    }

    // status === 'valid' → 비밀번호 설정 폼
    return (
      <>
        <AlertModal
          open={modal.open}
          onOpenChange={(open) => {
            if (!open) setModal({ open: false, message: '' });
          }}
          message={modal.message}
          primaryButton={modal.primaryButton}
          secondaryButton={modal.secondaryButton}
        />
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="rounded-full bg-orange-100 p-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">비밀번호 초기화</h1>
              <p className="text-muted-foreground">
                새로운 비밀번호를 설정해주세요.
              </p>
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
              <Label htmlFor="id">아이디 (이메일)</Label>
              <Input
                id="id"
                type="text"
                value={validatedEmail}
                readOnly
                className="bg-muted cursor-not-allowed"
                aria-readonly
              />
            </div>
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
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              {isSubmitting ? '처리 중...' : '비밀번호 초기화 완료'}
            </Button>
          </form>
        </div>
      </>
    );
  }

  // ========== 토큰 없으면 request step (LGN-200) ==========
  return (
    <>
      <AlertModal
        open={modal.open}
        onOpenChange={(open) => {
          if (!open) setModal({ open: false, message: '' });
        }}
        message={modal.message}
        primaryButton={modal.primaryButton}
        secondaryButton={modal.secondaryButton}
      />
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="rounded-full bg-primary-subtle p-4">
            <AlertCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">비밀번호 초기화</h1>
            <p className="text-muted-foreground whitespace-pre-line">
              {'비밀번호 초기화를 위한 이메일을 입력해 주세요.\n입력하신 이메일 주소로 초기화 링크가 전송됩니다.'}
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
            <Label htmlFor="email">아이디 (이메일)</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </div>
          <Button
            size="xl"
            type="submit"
            className="w-full"
            disabled={isSubmitting || !email.trim()}
          >
            {isSubmitting ? '처리 중...' : '비밀번호 초기화'}
          </Button>
        </form>
      </div>
    </>
  );
}
