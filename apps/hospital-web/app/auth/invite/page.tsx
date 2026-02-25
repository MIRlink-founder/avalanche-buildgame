'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Separator } from '@mire/ui';
import { Input } from '@mire/ui';
import { Label } from '@mire/ui';
import Navigation from '@/components/layout/Navigation';
import { ACCOUNT_ROLE_LABELS } from '@/lib/admin-hospital-format';
import { AlertCircle, CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';

function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);
  return hasLetter && hasNumber && hasSpecial;
}

function InviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>(
    'loading',
  );
  const [invalidReason, setInvalidReason] = useState<
    'invalid' | 'expired' | null
  >(null);
  const [hospitalName, setHospitalName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('DEPT_ADMIN');
  const [name, setName] = useState('');
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
  const canSubmit =
    passwordValid && passwordMatch && !isSubmitting && name.trim().length > 0;

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setInvalidReason('invalid');
      return;
    }
    fetch(`/api/auth/invite/confirm?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setStatus('valid');
          setInvalidReason(null);
          setHospitalName(data.hospitalName ?? '');
          setEmail(data.email ?? '');
          setName(data.name ?? '');
          setRole(data.role ?? 'DEPT_ADMIN');
        } else {
          setStatus('invalid');
          setInvalidReason(data.reason === 'expired' ? 'expired' : 'invalid');
        }
      })
      .catch(() => {
        setStatus('invalid');
        setInvalidReason('invalid');
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
    if (!name.trim()) {
      setSubmitError('이름을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/invite/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          passwordConfirm,
          name: name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? '계정 설정에 실패했습니다.';
        if (msg.includes('만료') || msg.includes('expired')) {
          alert(
            '초대 링크가 만료되었습니다. 관리자에게 재발송을 요청해주세요.',
          );
          router.push('/');
          return;
        }
        setSubmitError(msg);
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      alert('계정 설정이 완료되었습니다. 로그인해주세요.');
      router.push('/');
    } catch {
      setSubmitError('계정 설정 중 오류가 발생했습니다.');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
            <p className="text-center text-lg font-medium text-foreground">
              {invalidReason === 'expired'
                ? '초대 링크의 유효기간이 만료되었습니다.'
                : '유효하지 않은 링크입니다.'}
            </p>
            <Button
              variant="outline"
              className="mt-6 w-full"
              size="xl"
              onClick={() => router.push('/')}
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-20">
      <Navigation />

      <div className="w-full max-w-4xl space-y-6 rounded-lg border bg-card p-12 shadow-sm">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="rounded-full bg-orange-100 p-4">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">직원 초대</h1>
          <p className="text-muted-foreground">
            초대받은 계정의 비밀번호를 설정해주세요.
          </p>
          <div className="space-y-1 text-muted-foreground">
            <p className="text-lg">{hospitalName}</p>
            <p className="text-sm">권한: {ACCOUNT_ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해주세요"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
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
            {isSubmitting ? '처리 중...' : '계정 설정 완료'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">확인 중...</p>
        </div>
      }
    >
      <InviteForm />
    </Suspense>
  );
}
