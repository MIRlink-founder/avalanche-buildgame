'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Separator } from '@mire/ui';
import { Label } from '@mire/ui';
import { Input } from '@mire/ui';
import Navigation from '@/components/layout/Navigation';
import { AlertModal } from '@/components/layout/AlertModal';
import { AlertCircle, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

// 영문·숫자·특수문자 조합 8자 이상
function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);
  return hasLetter && hasNumber && hasSpecial;
}

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>(
    'loading',
  );
  /** invalid일 때 구분: 잘못된/이미 사용된 링크 vs 유효기간 만료 */
  const [invalidReason, setInvalidReason] = useState<
    'invalid' | 'expired' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValid = useMemo(() => isValidPassword(password), [password]);
  const passwordMatch = useMemo(
    () => password.length > 0 && password === passwordConfirm,
    [password, passwordConfirm],
  );
  const canSubmit = passwordValid && passwordMatch && !isSubmitting;

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setInvalidReason('invalid');
      setError('토큰이 없습니다.');
      return;
    }
    fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setStatus('valid');
          setInvalidReason(null);
          setHospitalName(data.hospitalName ?? '');
          setEmail(data.email ?? '');
        } else {
          setStatus('invalid');
          setInvalidReason(data.reason === 'expired' ? 'expired' : 'invalid');
          setError(data.error ?? '유효하지 않은 링크입니다.');
        }
      })
      .catch(() => {
        setStatus('invalid');
        setInvalidReason('invalid');
        setError('검증 중 오류가 발생했습니다.');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!token || !canSubmit) return;
    if (!passwordValid) {
      setSubmitError('영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setSubmitError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          passwordConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? '활성화에 실패했습니다.';
        if (msg.includes('만료') || msg.includes('expired')) {
          alert('토큰이 만료되었습니다.');
          router.push('/login');
          return;
        }
        setSubmitError(msg);
        return;
      }
      alert('계정 활성화가 완료되었습니다.');
      router.push('/');
    } catch {
      setSubmitError('활성화 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">확인 중...</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Navigation />
        <AlertModal
          open={true}
          onOpenChange={(open) => {
            if (!open) router.push('/');
          }}
          message={
            invalidReason === 'expired'
              ? '인증 링크의 유효기간이 만료되었습니다.'
              : '유효하지 않은 링크입니다.'
          }
          primaryButton={
            invalidReason === 'expired'
              ? { label: '메일 재발송', onClick: () => router.push('/') }
              : undefined
          }
          secondaryButton={
            invalidReason !== 'expired'
              ? { label: '확인', onClick: () => router.push('/') }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* 상단 네비게이션 - 고정 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <div className="w-full max-w-4xl space-y-6 rounded-lg border bg-card p-12 shadow-sm">
        <div className="flex flex-col justify-center items-center space-y-6">
          <div className="rounded-full bg-orange-100 p-4">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            회원가입을 축하합니다!
          </h1>
          <p className="text-muted-foreground">
            서비스 이용을 위해 비밀번호를 설정해주세요.
          </p>
          <p className="text-lg text-muted-foreground">{hospitalName}</p>
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="id">아이디 (이메일)</Label>
            <Input
              id="id"
              type="text"
              value={email}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
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
                  passwordValid ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {passwordValid ? (
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
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 다시 입력"
                required
                minLength={8}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((v) => !v)}
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
            disabled={!canSubmit}
          >
            {isSubmitting ? '처리 중...' : '회원가입 완료'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">확인 중...</p>
        </div>
      }
    >
      <ActivateForm />
    </Suspense>
  );
}
