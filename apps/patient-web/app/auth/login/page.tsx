'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  setRecordSession,
  getPatientIdFromSession,
  getRecordSession,
  clearRecordSession,
  setRecordSessionExpiresAt,
} from '@/lib/records-session';
import { getPinCodeFromHash } from '@/lib/patient-url';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@mire/ui/components/dialog';
import { Button } from '@mire/ui/components/button';

const MAX_ATTEMPTS = 5;

function PinDots({ length }: { length: number }) {
  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`h-3 w-3 rounded-full border-2 transition-colors ${
            i < length
              ? 'border-primary bg-primary'
              : 'border-dark-4 bg-transparent'
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<ReactNode | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = getPatientIdFromSession();
    setPatientId(id || null);
    if (!id) router.replace('/');
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [wrongCount]);

  useEffect(() => {
    if (
      !patientId ||
      pin.length !== 6 ||
      submittedRef.current ||
      wrongCount >= MAX_ATTEMPTS
    )
      return undefined;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, pin }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        return res.json().then((body) => Promise.reject(body));
      })
      .then(() => {
        const pinFromHash = getPinCodeFromHash();
        const { pinCode: pinFromSession } = getRecordSession();
        const pinCode = pinFromHash || pinFromSession;
        if (typeof window !== 'undefined' && pinCode)
          setRecordSession(patientId, pinCode);
        setRecordSessionExpiresAt();
        router.push('/record');
        return undefined;
      })
      .catch(() => {
        submittedRef.current = false;
        setSubmitting(false);
        const next = wrongCount + 1;
        setWrongCount(next);
        setError(
          <span>
            비밀번호가 일치하지 않습니다.
            <br /> 다시 입력해주세요. ({next}/{MAX_ATTEMPTS})
          </span>,
        );
        setPin('');
        setTimeout(() => inputRef.current?.focus(), 300);
        if (next >= MAX_ATTEMPTS) setShowResetModal(true);
      });
    return undefined;
  }, [patientId, pin, wrongCount, router]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setError(null);
    setPin(v);
  }, []);

  const handleResetScan = useCallback(() => {
    clearRecordSession();
    setShowResetModal(false);
    router.replace('/');
  }, [router]);

  if (patientId === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">확인 중...</p>
      </div>
    );
  }
  if (!patientId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">환자 정보가 없습니다.</p>
        <Link href="/" className="text-primary underline">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">
          비밀번호 입력
        </h1>
        <div className="w-10" />
      </header>

      <div className="flex flex-1 flex-col gap-16 px-6 py-8 sm:mx-auto sm:max-w-md sm:px-0">
        <div className="flex flex-col gap-4">
          <p className="text-center text-lg font-medium leading-snug text-foreground">
            안전한 열람을 위해
            <br /> 비밀번호를 입력해 주세요.
          </p>
          <p className="text-center text-sm text-dark-3">
            본인 확인을 위해 설정해 두신
            <br /> 6자리 숫자를 입력해 주세요.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            className="cursor-pointer focus:outline-none"
            onClick={() => inputRef.current?.focus()}
            aria-label="비밀번호 입력"
          >
            <PinDots length={pin.length} />
          </button>
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </div>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="one-time-code"
          value={pin}
          onChange={handleChange}
          className="absolute -left-[9999px] top-0 h-0 w-0 opacity-0 outline-none caret-transparent"
          aria-label="6자리 비밀번호"
          disabled={submitting}
        />
      </div>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              비밀번호를 잊으셨나요?
            </DialogTitle>
            <DialogDescription className="text-center mt-4">
              발급받으신 카드의 QR코드를 다시 스캔하시면 <br /> 비밀번호를 새로
              설정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="xl" className="w-full" onClick={handleResetScan}>
              카드 QR코드 스캔하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
