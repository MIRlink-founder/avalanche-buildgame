'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mire/ui';

interface BarcodeScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 바코드 스캔 모달. 포커스 활성화로 핸디형 스캐너 신호 대기, 스캔 성공 시 환자 상세(진료 기록)로 이동. 바코드 번호는 화면에 노출되지 않음.
export function BarcodeScanModal({
  open,
  onOpenChange,
}: BarcodeScanModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (value) {
      onOpenChange(false);
      router.push(`/records?barcode=${encodeURIComponent(value)}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <p className="text-center text-foreground">
          환자 카드의 바코드를 리더기로 스캔해주세요.
        </p>
        <form onSubmit={handleSubmit}>
          {/* 스캐너 전용: 화면에 노출하지 않고 포커스만 받아 바코드 수신 */}
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            tabIndex={0}
            className="absolute h-0 w-0 opacity-0"
            aria-label="바코드 스캔"
          />
          <Button
            type="button"
            variant="ghost"
            className="mt-6 w-full bg-muted-foreground text-white hover:bg-muted-foreground/90 hover:text-white"
            size="xl"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </form>
      </div>
    </div>
  );
}
