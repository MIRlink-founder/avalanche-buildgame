'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@mire/ui/components/button';
import { ArrowRight } from 'lucide-react';
import { setRecordSession } from '@/lib/records-session';
import { getPinCodeFromHash } from '@/lib/patient-url';

export default function PatientHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId')?.trim() ?? '';
  const [loading, setLoading] = useState(false);

  // QR 랜딩 시 patientId + pinCode(해시) 모두 세션에 저장
  useEffect(() => {
    if (!patientId || typeof window === 'undefined') return;
    const pinCode = getPinCodeFromHash();
    setRecordSession(patientId, pinCode);
  }, [patientId]);

  const handleClick = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/auth/check-pin?patientId=${encodeURIComponent(patientId)}`,
      );
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { hasPin?: boolean };
      const path = data.hasPin ? '/auth/login' : '/auth/set-password';
      router.push(path);
    } catch {
      setLoading(false);
    }
  };

  const disabled = !patientId || loading;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* 헤더: 서비스명 */}
      <header className="flex shrink-0 justify-center border-b border-border py-4">
        <img src="/assets/Logo.svg" alt="Mirlink Logo" width={80} />
      </header>

      {/* 본문: 모바일 중심, 패딩 */}
      <div className="flex flex-1 flex-col px-6 py-8 sm:mx-auto sm:max-w-md sm:px-0">
        {/* 핵심 메시지 */}
        <h2 className="text-center text-xl font-medium leading-snug text-primary sm:text-2xl">
          안전하고 투명한
          <br /> 나의 임플란트 기록, 미래링크
        </h2>

        {/* 보증서 → 디지털 기록 시각 섹션 */}
        <div className="mt-8 rounded-xl bg-primary-subtle px-8 py-10">
          <img
            src="/assets/Container.svg"
            alt="Mirlink Logo"
            className="w-full"
          />
          <p className="text-center text-sm text-dark-3">
            물리적 보증서에서 안전한 디지털 기록으로
          </p>
        </div>

        {/* CTA: 내 진료 기록 확인하기 */}
        <div className="fixed bottom-6 left-1/2 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-6">
          {!patientId && (
            <p className="text-center text-xs text-muted-foreground">
              카드에 있는 QR을 통해 접속해 주세요.
            </p>
          )}
          <Button
            size="lg"
            className={`h-12 ${!patientId ? 'bg-dark-4' : ''}`}
            disabled={disabled}
            onClick={handleClick}
          >
            내 진료 기록 확인하기
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </main>
  );
}
