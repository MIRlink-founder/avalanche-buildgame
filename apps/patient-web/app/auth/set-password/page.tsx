'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  setRecordSession,
  getPatientIdFromSession,
  setRecordSessionExpiresAt,
} from '@/lib/records-session';
import { getPinCodeFromHash } from '@/lib/patient-url';

const STEP1_HEADLINE = (
  <span>
    진료 기록을 안전하게 보관할
    <br /> 6자리 비밀번호를 설정해주세요.
  </span>
);
const STEP1_SUB = (
  <span>
    이 비밀번호는 기기 내 안전하게 저장되며,
    <br /> 다음 열람 시 필요합니다.
  </span>
);
const STEP2_HEADLINE = (
  <span>
    확인을 위해 비밀번호를 <br />한 번 더 입력해 주세요.
  </span>
);
const STEP2_SUB = (
  <span>
    앞서 설정한 6자리 숫자와 <br />
    동일하게 입력해 주세요.
  </span>
);
const ERROR_MISMATCH = (
  <span>
    비밀번호가 일치하지 않습니다.
    <br /> 다시 입력해주세요.
  </span>
);

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

export default function SetPasswordPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = getPatientIdFromSession();
    setPatientId(id || null);
    if (!id) router.replace('/');
  }, [router]);

  const [step, setStep] = useState<1 | 2>(1);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<ReactNode | null>(null);
  const [fade, setFade] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const value = step === 1 ? pin1 : pin2;

  // 진입·단계 전환 시 input 포커스 → 휴대폰 숫자 키패드 열림
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [step]);

  // 6자리 입력 시 자동 전환(1단계 → 2단계) 또는 검증(2단계)
  useEffect(() => {
    if (step === 1 && pin1.length === 6) {
      setFade(true);
      const t = setTimeout(() => {
        setStep(2);
        setPin2('');
        setFade(false);
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(t);
    }
    if (step === 2 && pin2.length === 6 && !submittedRef.current) {
      if (!patientId) return undefined;
      if (pin2 !== pin1) {
        setError(ERROR_MISMATCH);
        setTimeout(() => setPin2(''), 300);
        return undefined;
      }
      submittedRef.current = true;
      setSubmitting(true);
      fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, pin: pin1 }),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((b) => Promise.reject(b));
          return undefined;
        })
        .then(() => {
          // 6자리 설정 성공 시 pinCode(QR 해시) 세션 저장 + 로그인 유효 15분 설정
          const pinCode = getPinCodeFromHash();
          if (typeof window !== 'undefined' && pinCode)
            setRecordSession(patientId, pinCode);
          setRecordSessionExpiresAt();
          router.push('/record');
          return undefined;
        })
        .catch(() => {
          submittedRef.current = false;
          setError('저장 중 오류가 발생했습니다.');
          setPin2('');
          setSubmitting(false);
        });
      return undefined;
    }
    return undefined;
  }, [step, pin1, pin2, patientId, router]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
      setError(null);
      if (step === 1) setPin1(v);
      else setPin2(v);
    },
    [step],
  );

  const handleBackButton = useCallback(() => {
    if (step === 2) {
      setStep(1);
      setPin1('');
      setPin2('');
      setError(null);
      inputRef.current?.focus();
    } else {
      router.back();
    }
  }, [step, router]);

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

  const headline = step === 1 ? STEP1_HEADLINE : STEP2_HEADLINE;
  const sub = step === 1 ? STEP1_SUB : STEP2_SUB;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={handleBackButton}
          className="flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">
          비밀번호 설정
        </h1>
        <div className="w-10" />
      </header>

      <div className="flex flex-1 flex-col gap-16 px-6 py-8 sm:mx-auto sm:max-w-md sm:px-0">
        <div
          className={`flex flex-col gap-4 transition-opacity duration-200 ${
            fade ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <p className="text-center text-lg font-medium leading-snug text-foreground">
            {headline}
          </p>
          <p className="mt-2 text-center text-sm text-dark-3">{sub}</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            className="cursor-pointer focus:outline-none"
            onClick={() => inputRef.current?.focus()}
            aria-label="비밀번호 입력"
          >
            <PinDots length={value.length} />
          </button>
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* 휴대폰 숫자 키패드 연동: 탭 시 키패드 열림 */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="one-time-code"
          value={value}
          onChange={handleChange}
          className="absolute h-0 w-0 opacity-0"
          aria-label="6자리 비밀번호"
          disabled={submitting}
        />
      </div>
    </main>
  );
}
