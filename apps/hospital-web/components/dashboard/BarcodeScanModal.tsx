'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Dialog, DialogContent, DialogTitle } from '@mire/ui';
import { getAuthHeaders } from '@/lib/get-auth-headers';
import { redirectIfUnauthorized } from '@/lib/get-auth-headers';
import {
  DUMMY_BARCODE,
  SESSION_KEY_RECORD_PATIENT_ID,
  SESSION_KEY_RECORD_PIN_CODE,
  parseBarcode,
} from '@/lib/records-session';

interface BarcodeScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PatientCheckResult {
  exists: boolean;
  patientGender?: string | null;
  patientAgeGroup?: string | null;
}

// 바코드 스캔 모달. 포커스 활성화로 핸디형 스캐너 신호 대기, 스캔 성공 시 기존 환자면 /records/view, 신규면 /records/create 로 이동. @mire/ui Dialog 기반.
export function BarcodeScanModal({
  open,
  onOpenChange,
}: BarcodeScanModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value) return;
    const parsed = parseBarcode(DUMMY_BARCODE); // TODO: value 로 변경
    if (!parsed) {
      alert(
        '바코드 형식이 올바르지 않습니다. 환자ID#PIN 형식으로 스캔해주세요.',
      );
      return;
    }
    onOpenChange(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY_RECORD_PATIENT_ID, parsed.patientId);
      sessionStorage.setItem(SESSION_KEY_RECORD_PIN_CODE, parsed.pin);
    }
    setChecking(true);
    fetch('/api/records/latest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ patientId: parsed.patientId, metaOnly: true }),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        return res.json();
      })
      .then((data: PatientCheckResult | null) => {
        if (data?.exists) {
          router.push('/records/view');
        } else {
          router.push('/records/create');
        }
      })
      .catch(() => {
        router.push('/records/create');
      })
      .finally(() => {
        setChecking(false);
      });
  };

  const handleClose = () => {
    onOpenChange(false);
    // if (typeof window !== 'undefined') {
    //   sessionStorage.setItem(
    //     SESSION_KEY_RECORD_PATIENT_ID,
    //     encodeURIComponent(DUMMY_BARCODE),
    //   );
    //   router.push('/records/create');
    // }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle></DialogTitle>
        <p className="text-center text-foreground">
          환자 카드의 바코드를 리더기로 스캔해주세요.
        </p>
        <form onSubmit={handleSubmit}>
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
            onClick={handleClose}
          >
            닫기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
