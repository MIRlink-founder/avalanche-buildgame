'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getRecordSession, isRecordSessionValid } from '@/lib/records-session';
import { decryptWithPin } from '@/lib/records-encrypt-client';
import type { LatestRecordPayload, TreatmentSheet } from '@/lib/record-types';
import { ToothChartReadOnly } from '@/components/record/ToothChartReadOnly';
import {
  RecordDetailCards,
  BlockchainCertSection,
} from '@/components/record/RecordDetailCards';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@mire/ui/components/sheet';
import { Button } from '@mire/ui/components/button';

interface RecordDateItem {
  id: number;
  treatedAt: string | null;
  createdAt: string;
}

function formatRecordDate(item: RecordDateItem): string {
  const dateStr = item.treatedAt ?? item.createdAt;
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function RecordPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState<string>('');
  const [dates, setDates] = useState<RecordDateItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [treatmentSheets, setTreatmentSheets] = useState<TreatmentSheet[]>([]);
  const [recordDateLabel, setRecordDateLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const loadingRecordRef = useRef(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // 세션에서 patientId, pinCode 읽기 + 로그인 유효(15분) 여부 검사
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { patientId: pid, pinCode: pin } = getRecordSession();
    if (!pid || !pin) {
      router.replace('/');
      return;
    }
    if (!isRecordSessionValid()) {
      router.replace('/auth/login');
      return;
    }
    setPatientId(pid);
    setPinCode(pin);
  }, [router]);

  // 진료 일자 목록 조회
  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    fetch('/api/records/dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(b));
        return res.json();
      })
      .then((data: { dates: RecordDateItem[] }) => {
        setDates(data.dates ?? []);
        if (data.dates?.length) {
          const first = data.dates[0];
          setSelectedId(first.id);
          setRecordDateLabel(formatRecordDate(first));
        }
      })
      .catch(() => setError('진료 일자 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [patientId]);

  // 선택된 기록 단건 조회 + 클라이언트 복호화
  const loadRecord = useCallback(
    async (recordId: number) => {
      if (!patientId || !pinCode || loadingRecordRef.current) return;
      loadingRecordRef.current = true;
      setError(null);
      try {
        const res = await fetch('/api/records/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId, recordId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? '진료 기록을 불러오지 못했습니다.');
        }
        const data: {
          encryptedPayload?: string;
          treatedAt?: string | null;
          createdAt?: string;
        } = await res.json();
        if (!data.encryptedPayload) {
          setTreatmentSheets([]);
          setRecordDateLabel('');
          return;
        }
        const plain = await decryptWithPin(data.encryptedPayload, pinCode);
        const payload = JSON.parse(plain) as LatestRecordPayload;
        if (Array.isArray(payload.treatmentSheets)) {
          setTreatmentSheets(payload.treatmentSheets);
          setSelectedTooth(null);
        } else {
          setTreatmentSheets([]);
        }
        const dateStr = data.treatedAt ?? data.createdAt;
        if (dateStr) {
          const d = new Date(dateStr);
          setRecordDateLabel(
            d.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }),
          );
        } else {
          setRecordDateLabel('');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '복호화에 실패했습니다.');
        setTreatmentSheets([]);
      } finally {
        loadingRecordRef.current = false;
      }
    },
    [patientId, pinCode],
  );

  useEffect(() => {
    if (selectedId != null && patientId && pinCode) {
      loadRecord(selectedId);
    }
  }, [selectedId, patientId, pinCode, loadRecord]);

  const handleSelectDate = (item: RecordDateItem) => {
    setSelectedId(item.id);
    setRecordDateLabel(formatRecordDate(item));
    setSheetOpen(false);
  };

  const savedTeeth = Array.from(new Set(treatmentSheets.map((s) => s.tooth)));

  // 해당 치아의 마지막 시트가 임플란트 제거이면 제거된 치아로 표시
  const implantRemovedTeeth = (() => {
    const byTooth = new Map<number, TreatmentSheet[]>();
    for (const s of treatmentSheets) {
      const list = byTooth.get(s.tooth) ?? [];
      list.push(s);
      byTooth.set(s.tooth, list);
    }
    const result: number[] = [];
    for (const [tooth, sheets] of byTooth) {
      if (sheets.length === 0) continue;
      const latest = sheets[sheets.length - 1];
      if (latest.type === 'implant_remove') result.push(tooth);
    }
    return result;
  })();

  // 선택된 치아가 있으면 해당 치아 시트만, 없으면 전체
  const displaySheets =
    selectedTooth != null
      ? treatmentSheets
          .filter((s) => s.tooth === selectedTooth)
          .slice()
          .reverse()
      : treatmentSheets.slice().reverse();

  if (patientId === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">확인 중...</p>
      </div>
    );
  }
  if (!patientId) {
    return null;
  }

  if (loading && dates.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">진료 기록을 불러오는 중...</p>
      </div>
    );
  }

  if (error && dates.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-destructive text-center">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">
          등록된 진료 기록이 없습니다.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background pb-8">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <h1 className="text-center text-lg font-semibold text-foreground">
          나의 진료 기록
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
        {/* 섹션 1: 진료 기록 선택 */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">
            진료 기록
          </h2>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-left text-foreground"
          >
            <span>{recordDateLabel || '날짜 선택'}</span>
            <ChevronDown className="size-5 text-muted-foreground" aria-hidden />
          </button>
        </section>

        {/* 섹션 2: 시술 부위 */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">
            시술 부위
          </h2>
          <ToothChartReadOnly
            savedTeeth={savedTeeth}
            selectedTooth={selectedTooth}
            onToothSelect={setSelectedTooth}
            implantRemovedTeeth={implantRemovedTeeth}
          />
        </section>

        {/* 섹션 3: 상세 진료 및 재료 정보 */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">
            상세 진료 및 재료 정보
            {selectedTooth != null && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (치아 #{selectedTooth}만 표시)
              </span>
            )}
          </h2>
          {error && selectedId != null ? (
            <p className="text-destructive text-sm py-2">{error}</p>
          ) : null}
          <RecordDetailCards treatmentSheets={displaySheets} />
        </section>

        {/* 섹션 4: 블록체인 인증 완료 */}
        <section>
          <BlockchainCertSection />
        </section>
      </div>

      {/* 바텀 시트: 진료 일자 목록 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[70vh] max-h-[400px] rounded-t-2xl"
          showCloseButton={true}
        >
          <SheetHeader>
            <SheetTitle>진료 일자 선택</SheetTitle>
          </SheetHeader>
          <ul className="mt-4 flex flex-col gap-1 overflow-auto">
            {dates.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelectDate(item)}
                  className={`w-full rounded-lg px-4 py-3 text-left text-sm ${
                    selectedId === item.id
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'bg-muted/50 text-foreground hover:bg-muted'
                  }`}
                >
                  {formatRecordDate(item)}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </main>
  );
}
