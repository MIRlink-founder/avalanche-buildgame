'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@mire/ui';
import { PatientInfoBar } from '@/components/records/PatientInfoBar';
import { ToothChart } from '@/components/records/ToothChart';
import {
  type TreatmentSheet,
  type SavedTreatmentRecord,
  type ImplantPlacementFormData,
  type ImplantProsthesisFormData,
  type LaminateFormData,
  type ImplantRemoveFormData,
} from '@/components/records/treatment-sheet-types';
import { getAuthHeaders } from '@/lib/get-auth-headers';
import { redirectIfUnauthorized } from '@/lib/get-auth-headers';
import {
  SESSION_KEY_RECORD_PATIENT_ID,
  SESSION_KEY_RECORD_PIN_CODE,
  SESSION_KEY_RECORD_EDIT_PAYLOAD,
} from '@/lib/records-session';
import { decryptWithPin } from '@/lib/records-encrypt-client';
import { SquarePen } from 'lucide-react';
import { ToothQuadrantCell } from '@/components/records/ToothQuadrantCell';
import type { PreInfo } from '@/components/records/PreInfoModal';

interface LatestRecordPayload {
  version: number;
  preInfo: PreInfo;
  treatmentSheets: TreatmentSheet[];
}

function RecordViewContent() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preInfo, setPreInfo] = useState<PreInfo | null>(null);
  const [treatmentSheets, setTreatmentSheets] = useState<TreatmentSheet[]>([]);
  const [recordDate, setRecordDate] = useState<Date | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<number | null>(null);
  const [activeSheetId, setActiveSheetId] = useState<string | 'add'>('add');

  // session에서 patientId, pinCode 읽기 (remove 하지 않음)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedPatientId = sessionStorage.getItem(
      SESSION_KEY_RECORD_PATIENT_ID,
    );
    const storedPin = sessionStorage.getItem(SESSION_KEY_RECORD_PIN_CODE);
    if (!storedPatientId) {
      alert('환자 카드의 바코드를 먼저 스캔해주세요.');
      router.replace('/dashboard');
      return;
    }
    setPatientId(storedPatientId);
    setPinCode(storedPin ?? '');
  }, [router]);

  // 최신 진료 기록 조회 및 복호화
  useEffect(() => {
    if (!patientId || !pinCode) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/records/latest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ patientId }),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (res.status === 404) {
          setError('해당 환자의 진료 기록이 없습니다.');
          return null;
        }
        return res.json();
      })
      .then(
        async (
          data: {
            encryptedPayload?: string;
            treatedAt?: string | null;
            createdAt?: string;
          } | null,
        ) => {
          if (cancelled || !data?.encryptedPayload) return;
          try {
            const plain = await decryptWithPin(data.encryptedPayload, pinCode);
            const payload = JSON.parse(plain) as LatestRecordPayload;
            if (payload.preInfo) setPreInfo(payload.preInfo);
            if (Array.isArray(payload.treatmentSheets))
              setTreatmentSheets(payload.treatmentSheets);
            const dateStr = data.treatedAt ?? data.createdAt;
            if (dateStr) setRecordDate(new Date(dateStr));
            if (payload.treatmentSheets?.length) {
              const first = payload.treatmentSheets[0];
              setSelectedTeeth(first.tooth);
              setActiveSheetId(first.id);
            }
          } catch {
            if (!cancelled)
              setError('진료 기록 복호화에 실패했습니다. PIN을 확인해주세요.');
          }
        },
      )
      .catch(() => {
        if (!cancelled) setError('진료 기록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, pinCode]);

  const savedRecords: SavedTreatmentRecord[] = treatmentSheets.map((s) => ({
    id: s.id,
    tooth: s.tooth,
    type: s.type,
    formData: s.formData,
    date: s.date ? new Date(s.date) : (recordDate ?? new Date()),
  }));

  const sheetsForSelectedTooth = treatmentSheets.filter(
    (s) => s.tooth === selectedTeeth,
  );
  const savedTeeth = Array.from(new Set(treatmentSheets.map((s) => s.tooth)));

  const implantRemovedTeeth = React.useMemo(() => {
    const byTooth = new Map<number, SavedTreatmentRecord[]>();
    for (const r of savedRecords) {
      const list = byTooth.get(r.tooth) ?? [];
      list.push(r);
      byTooth.set(r.tooth, list);
    }
    const result: number[] = [];
    for (const [tooth, records] of byTooth) {
      if (records.length === 0) continue;
      const latest = records[records.length - 1];
      if (latest.type === 'implant_remove') result.push(tooth);
    }
    return result;
  }, [savedRecords]);

  const handleOpenSavedRecord = useCallback(
    (record: SavedTreatmentRecord) => {
      setSelectedTeeth(record.tooth);
      const sheet = treatmentSheets.find((s) => s.id === record.id);
      setActiveSheetId(sheet?.id ?? 'add');
    },
    [treatmentSheets],
  );

  const handleToothToggle = useCallback(
    (tooth: number | null) => {
      setSelectedTeeth(tooth);
      if (tooth !== null) {
        const sheets = treatmentSheets.filter((s) => s.tooth === tooth);
        const latest = sheets.length > 0 ? sheets[sheets.length - 1] : null;
        setActiveSheetId(latest?.id ?? 'add');
      } else {
        setActiveSheetId('add');
      }
    },
    [treatmentSheets],
  );

  const handleEditClick = () => {
    if (!preInfo || !treatmentSheets.length) return;
    sessionStorage.setItem(
      SESSION_KEY_RECORD_EDIT_PAYLOAD,
      JSON.stringify({ preInfo, savedRecords }),
    );
    router.push('/records/create');
  };

  if (!patientId) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 pt-6 sm:px-6 lg:px-8 gap-4" />
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 pt-6 sm:px-6 lg:px-8 gap-4">
        <p className="text-muted-foreground">진료 기록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 pt-6 sm:px-6 lg:px-8 gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">대시보드로</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 pt-6 sm:px-6 lg:px-8 gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">진료 기록 조회</h1>
        <div className="flex gap-2">
          <Button onClick={handleEditClick}>
            <SquarePen /> 진료 기록 편집
          </Button>
        </div>
      </header>

      <div className="flex justify-between">
        <PatientInfoBar
          patientId={patientId}
          treatmentDate={preInfo?.treatmentDate ?? ''}
          birthDate={preInfo?.birthDate ?? ''}
          gender={preInfo?.gender ?? undefined}
          phmLabel={preInfo?.phm ?? undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0 border-t">
        <div className="lg:col-span-1 flex flex-col min-h-0 border-r">
          <div className="flex-1 min-h-0 bg-muted/20 overflow-auto">
            <div className="grid grid-cols-[auto_auto_1fr] gap-0 content-start">
              <p className="p-1.5 text-center bg-muted-foreground/10 text-xs font-medium text-muted-foreground border-b border-r border-border">
                날짜
              </p>
              <p className="p-1.5 text-center bg-muted-foreground/10 text-xs font-medium text-muted-foreground border-b border-r border-border">
                치식
              </p>
              <p className="p-1.5 text-center bg-muted-foreground/10 text-xs font-medium text-muted-foreground border-b border-border">
                진료 내용
              </p>
              {[...savedRecords].reverse().map((record) => (
                <React.Fragment key={record.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenSavedRecord(record)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenSavedRecord(record);
                      }
                    }}
                    className="p-2 flex items-center text-center text-sm border-b border-r border-border bg-background cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {record.date.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenSavedRecord(record)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenSavedRecord(record);
                      }
                    }}
                    className="p-2 flex items-center justify-center border-b border-r border-border bg-background cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ToothQuadrantCell tooth={record.tooth} />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenSavedRecord(record)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenSavedRecord(record);
                      }
                    }}
                    className="p-2 border-b border-border bg-background text-sm min-w-0 cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {record.type === 'implant_placement' && record.formData ? (
                      (() => {
                        const fd = record.formData as ImplantPlacementFormData;
                        return (
                          <div className="text-xs flex flex-col gap-0.5">
                            <span className="font-medium text-sm mb-1">
                              임플란트 식립
                            </span>
                            <p>치아번호: #{record.tooth}</p>
                            {fd.fixture && <p>- Fixture: {fd.fixture}</p>}
                            {fd.initialFixation && (
                              <p>- 초기고정: {fd.initialFixation}</p>
                            )}
                            {fd.boneQuality && (
                              <p>
                                - 골질: {fd.boneQuality}{' '}
                                {fd.keratinizedGingiva && (
                                  <>({fd.keratinizedGingiva})</>
                                )}
                              </p>
                            )}

                            {fd.sinusLift && (
                              <p>
                                - 상악동거상: {fd.sinusLift}{' '}
                                {fd.sinusLiftMaterials && (
                                  <>
                                    (
                                    {fd.sinusLiftMaterials
                                      .map((o) => o)
                                      .join(', ')}
                                    )
                                  </>
                                )}{' '}
                              </p>
                            )}
                            {fd.boneGraft?.length ? (
                              <p>- 골이식: {fd.boneGraft.join(', ')}</p>
                            ) : null}
                            {fd.surgeryCount && (
                              <p>
                                - 수술 횟수: {fd.surgeryCount}{' '}
                                {fd.healingInput &&
                                  (() => {
                                    const phi = fd.healingPhi;
                                    const height = fd.healingHeight;
                                    let detail = '';
                                    if (phi || height) {
                                      const parts: string[] = [];
                                      if (phi) parts.push(`Φ=${phi}`);
                                      if (height) parts.push(`H=${height}`);
                                      detail = ` - ${parts.join(', ')}`;
                                    }
                                    return `(힐링 입력${detail})`;
                                  })()}
                              </p>
                            )}
                            {fd.prosthesisTiming && (
                              <p>- 보철시기: {fd.prosthesisTiming}</p>
                            )}
                            {fd.comment && <p>- {fd.comment}</p>}
                          </div>
                        );
                      })()
                    ) : record.type === 'implant_prosthesis' &&
                      record.formData ? (
                      (() => {
                        const fd = record.formData as ImplantProsthesisFormData;
                        const methodLabel =
                          fd.method === '직접 입력'
                            ? fd.methodDirectInput
                            : fd.method;
                        let abutmentLabel: string | undefined;
                        if (fd.abutmentType === '직접 입력') {
                          abutmentLabel =
                            fd.abutmentDirectInput ?? fd.abutmentPreset;
                        } else if (
                          fd.abutmentType === 'Solid(Rigid)' ||
                          fd.abutmentType === 'Transfer(SCRP)'
                        ) {
                          abutmentLabel = fd.abutmentSubType
                            ? `${fd.abutmentType} / ${fd.abutmentSubType}${fd.abutmentZirconia ? ' / 지르코니아 Abut' : ''}`
                            : fd.abutmentType;
                        } else if (fd.abutmentType === '오버덴취용') {
                          abutmentLabel = fd.abutmentOverdent
                            ? fd.abutmentOverdent === '기타' &&
                              (fd.abutmentDirectInput ?? fd.abutmentPreset)
                              ? `오버덴취용 / ${fd.abutmentDirectInput ?? fd.abutmentPreset}`
                              : `오버덴취용 / ${fd.abutmentOverdent}`
                            : fd.abutmentType;
                        } else if (fd.abutmentType === 'UCLA') {
                          abutmentLabel = fd.abutmentDirectInput
                            ? `UCLA / ${fd.abutmentDirectInput}`
                            : 'UCLA';
                        } else {
                          abutmentLabel = fd.abutmentType;
                        }
                        return (
                          <div className="text-xs flex flex-col gap-0.5">
                            <span className="font-medium text-sm mb-1">
                              임플란트 보철
                            </span>
                            <p>치아번호: #{record.tooth}</p>
                            {methodLabel && <p>- 방식: {methodLabel}</p>}
                            {fd.cementationType && (
                              <p>- 접착 유형: {fd.cementationType}</p>
                            )}
                            {abutmentLabel && (
                              <p>
                                - 어벗 선택: {abutmentLabel}
                                {fd.hexStatus && (
                                  <>
                                    {' '}
                                    (
                                    {fd.hexStatus === 'hex'
                                      ? 'Hex'
                                      : fd.hexStatus === 'non_hex'
                                        ? 'Non-Hex'
                                        : '-'}
                                    {fd.sizeNotEntered === false ? (
                                      <>
                                        {' - '}
                                        Φ={fd.diameter ?? '-'}, C=
                                        {fd.cuff ?? '-'}, H={fd.height ?? '-'}
                                      </>
                                    ) : null}
                                    )
                                  </>
                                )}
                                {fd.torque && ` - ${fd.torque}`}
                              </p>
                            )}
                            {fd.comment && <p>- {fd.comment}</p>}
                          </div>
                        );
                      })()
                    ) : record.type === 'laminate' && record.formData ? (
                      (() => {
                        const fd = record.formData as LaminateFormData;
                        return (
                          <div className="text-xs flex flex-col gap-0.5">
                            <span className="font-medium text-sm mb-1">
                              라미네이트
                            </span>
                            <p>치아번호: #{record.tooth}</p>
                            {fd.manufacturer && (
                              <p>- 제조사: {fd.manufacturer}</p>
                            )}
                            {fd.product && <p>- 제품명: {fd.product}</p>}
                            {fd.shade && <p>- Shade: {fd.shade}</p>}
                            {fd.lot && <p>- LOT: {fd.lot}</p>}
                            {fd.cement && <p>- 시멘트: {fd.cement}</p>}
                            {fd.comment && <p>- {fd.comment}</p>}
                          </div>
                        );
                      })()
                    ) : record.type === 'implant_remove' && record.formData ? (
                      (() => {
                        const fd = record.formData as ImplantRemoveFormData;
                        return (
                          <div className="text-xs flex flex-col gap-0.5">
                            <span className="font-medium text-sm mb-1">
                              임플란트 제거
                            </span>
                            <p>치아번호: #{record.tooth}</p>
                            {fd.method && <p>- 방식: {fd.method}</p>}
                            {fd.comment && <p>- {fd.comment}</p>}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-muted-foreground">준비 중입니다</p>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <ToothChart
            selectedTeeth={selectedTeeth}
            onToggle={handleToothToggle}
            emptyLabel="치식에서 치아를 선택하면 진료 내용을 볼 수 있습니다."
            sheetsForSelectedTooth={sheetsForSelectedTooth}
            activeSheetId={activeSheetId}
            onActiveSheetChange={setActiveSheetId}
            savedTeeth={savedTeeth}
            implantRemovedTeeth={implantRemovedTeeth}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

export default function RecordViewPage() {
  return (
    <React.Suspense
      fallback={<div className="p-6 text-muted-foreground">로딩 중...</div>}
    >
      <RecordViewContent />
    </React.Suspense>
  );
}
