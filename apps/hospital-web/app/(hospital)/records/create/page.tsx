'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mire/ui';
import { AlertModal } from '@/components/layout/AlertModal';
import {
  PreInfoModal,
  type PreInfo,
  type PreInfoModalMode,
} from '@/components/records/PreInfoModal';
import { PatientInfoBar } from '@/components/records/PatientInfoBar';
import { ToothChart } from '@/components/records/ToothChart';
import { ImplantPlacementSheet } from '@/components/records/ImplantPlacementSheet';
import { ImplantProsthesisSheet } from '@/components/records/ImplantProsthesisSheet';
import { LaminateSheet } from '@/components/records/LaminateSheet';
import {
  type TreatmentSheet,
  type TreatmentSheetType,
  type SavedTreatmentRecord,
  type ImplantPlacementFormData,
  type ImplantProsthesisFormData,
  type LaminateFormData,
} from '@/components/records/treatment-sheet-types';
import { getAuthHeaders } from '@/lib/get-auth-headers';
import { redirectIfUnauthorized } from '@/lib/get-auth-headers';
import {
  SESSION_KEY_RECORD_PATIENT_ID,
  DUMMY_BARCODE,
} from '@/lib/records-session';
import { BookSearch, ClipboardClock, ClipboardPen } from 'lucide-react';
import { ToothQuadrantCell } from '@/components/records/ToothQuadrantCell';

function generateSheetId() {
  return `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
interface PatientCheckResult {
  exists: boolean;
  patientGender?: string | null;
  patientAgeGroup?: string | null;
}

function CreateContent() {
  const router = useRouter();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [modalMode, setModalMode] = useState<PreInfoModalMode>('full');
  const [existingPatientGender, setExistingPatientGender] = useState<'M' | 'F'>(
    'M',
  );
  const [preInfo, setPreInfo] = useState<PreInfo | null>(null);
  const [preInfoModalOpen, setPreInfoModalOpen] = useState(false);
  const [isEditingPreInfo, setIsEditingPreInfo] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [registerConfirmOpen, setRegisterConfirmOpen] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number | null>(null);
  const [treatmentSheets, setTreatmentSheets] = useState<TreatmentSheet[]>([]);
  const [savedRecords, setSavedRecords] = useState<SavedTreatmentRecord[]>([]); // 임시 저장 데이터
  const [activeSheetId, setActiveSheetId] = useState<string | 'add'>('add'); // 현재 선택된 진료 시트 탭

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(SESSION_KEY_RECORD_PATIENT_ID);
    if (!stored) {
      alert('환자 카드의 바코드를 먼저 스캔해주세요.');
      router.replace('/dashboard');
      return;
    }
    try {
      setPatientId(decodeURIComponent(stored));
    } catch {
      setPatientId(DUMMY_BARCODE);
    }
  }, [router]);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setPatientLoading(true);
    fetch(`/api/records/patient?patientId=${encodeURIComponent(patientId)}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        return res.json();
      })
      .then((data: PatientCheckResult | null) => {
        if (cancelled) return;
        if (data?.exists) {
          setModalMode('dateOnly');
          setExistingPatientGender(data.patientGender === 'F' ? 'F' : 'M');
        } else {
          setModalMode('full');
        }
        setPreInfoModalOpen(true);
      })
      .catch(() => {
        if (!cancelled) setPreInfoModalOpen(true);
        setModalMode('full');
      })
      .finally(() => {
        if (!cancelled) setPatientLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const handlePreInfoComplete = (data: PreInfo) => {
    setPreInfo(data);
    setPreInfoModalOpen(false);
  };

  // 치아 선택
  const toggleTooth = useCallback(
    (n: number) => {
      setSelectedTeeth((prev) => {
        if (prev !== null && prev !== n) {
          const sheetsForN = savedRecords
            .filter((r) => r.tooth === n)
            .map((r) => ({
              id: r.id,
              tooth: r.tooth,
              type: r.type,
              formData: r.formData,
            }));
          setTreatmentSheets(sheetsForN);
          setActiveSheetId(sheetsForN[0]?.id ?? 'add');
        }
        return n;
      });
    },
    [savedRecords],
  );

  const handleResetTooth = useCallback(() => {
    setSelectedTeeth(null);
    setTreatmentSheets([]);
    setActiveSheetId('add');
    setSavedRecords([]);
  }, []);

  const handleAddSheet = useCallback(
    (tooth: number, type: TreatmentSheetType) => {
      const newSheet: TreatmentSheet = {
        id: generateSheetId(),
        tooth,
        type,
        formData:
          type === 'implant_placement' ||
          type === 'implant_prosthesis' ||
          type === 'laminate'
            ? {}
            : undefined,
      };
      setTreatmentSheets((prev) => [...prev, newSheet]);
      setActiveSheetId(newSheet.id);
    },
    [],
  );

  // 왼쪽 임시 저장된 행 클릭 시 오른쪽 탭에서 수정
  const handleOpenSavedRecord = useCallback(
    (record: SavedTreatmentRecord) => {
      setSelectedTeeth(record.tooth);
      const sheetsForTooth = savedRecords
        .filter((r) => r.tooth === record.tooth)
        .map((r) => ({
          id: r.id,
          tooth: r.tooth,
          type: r.type,
          formData: r.formData,
        }));
      setTreatmentSheets(sheetsForTooth);
      setActiveSheetId(record.id);
    },
    [savedRecords],
  );

  const handleUpdateSheetFormData = useCallback(
    (sheetId: string, formData: TreatmentSheet['formData']) => {
      setTreatmentSheets((prev) =>
        prev.map((s) =>
          s.id === sheetId ? { ...s, formData: formData ?? {} } : s,
        ),
      );
    },
    [],
  );

  // 시트 탭에서 제거 (편집 배열 + 왼쪽 임시 저장 목록에서도 제거)
  const handleRemoveSheet = useCallback(
    (sheetId: string) => {
      setTreatmentSheets((prev) => {
        const next = prev.filter((s) => s.id !== sheetId);
        setActiveSheetId((current) => {
          if (current === sheetId) {
            const sameToothSheets = next.filter(
              (s) => s.tooth === selectedTeeth,
            );
            return sameToothSheets[0]?.id ?? 'add';
          }
          return current;
        });
        return next;
      });
      setSavedRecords((prev) => prev.filter((r) => r.id !== sheetId));
    },
    [selectedTeeth],
  );

  // 임시 저장: 기존 id면 갱신, 없으면 새 id로 추가
  const handleDraftSave = useCallback(() => {
    const now = new Date();
    setSavedRecords((prev) => {
      const byId = new Map(prev.map((r) => [r.id, r]));
      for (const s of treatmentSheets) {
        byId.set(s.id, {
          id: s.id,
          date: now,
          tooth: s.tooth,
          type: s.type,
          formData: s.formData,
        });
      }
      return Array.from(byId.values());
    });
    setRegisterConfirmOpen(false);
  }, [treatmentSheets]);

  const sheetsForSelectedTooth =
    selectedTeeth !== null
      ? treatmentSheets.filter((s) => s.tooth === selectedTeeth)
      : [];

  // 임시 저장된 데이터가 있는 치아 번호 목록 (치식 붉은색 표시용)
  const savedTeeth = React.useMemo(
    () => [...new Set(savedRecords.map((r) => r.tooth))],
    [savedRecords],
  );

  const handleCancelConfirm = () => {
    setCancelConfirmOpen(false);
    router.push('/dashboard');
  };

  const handleRegisterConfirm = () => {
    setRegisterConfirmOpen(false); // TODO: 등록
    alert('진료 기록이 등록되었습니다.');
  };

  if (!patientId) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 pt-6 sm:px-6 lg:px-8 gap-4"></div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 pt-6 sm:px-6 lg:px-8 gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">진료 기록 생성</h1>
        <Button variant="ghost">
          <BookSearch /> 진료 기록 조회
        </Button>
      </header>

      {/* 위쪽 */}
      <div className="flex justify-between">
        <PatientInfoBar
          patientId={patientId}
          treatmentDate={preInfo?.treatmentDate ?? ''}
          birthDate={preInfo?.birthDate ?? ''}
          gender={preInfo?.gender ?? undefined}
          phmLabel={preInfo?.phm ?? undefined}
          showPhmEdit
          onPhmEdit={() => {
            setIsEditingPreInfo(true);
            setPreInfoModalOpen(true);
          }}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCancelConfirmOpen(true)}>
            생성 취소
          </Button>
          <Button
            onClick={() => {
              if (treatmentSheets.length === 0) {
                alert(
                  '추가된 진료 시트가 없습니다. 치아를 선택한 뒤 진료 타입을 추가해주세요.',
                );
                return;
              }
              handleDraftSave();
            }}
          >
            <ClipboardClock /> 임시 저장
          </Button>
          <Button onClick={() => setRegisterConfirmOpen(true)}>
            <ClipboardPen /> 진료 기록 등록
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0 border-t">
        {/* 왼쪽: 임시 저장된 진료 목록 (날짜 = 임시 저장 시점) */}
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
                  {/* 날짜 */}
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
                  {/* 치식 */}
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
                  {/* 진료 내용 */}
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
                                  (fd.healingInput
                                    ? '(힐링 입력: O)'
                                    : '(힐링 입력: X)')}
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
                            ? `${fd.abutmentType} / ${fd.abutmentSubType}`
                            : fd.abutmentType;
                        } else if (fd.abutmentType === '오버덴취용') {
                          abutmentLabel = fd.abutmentOverdent
                            ? fd.abutmentOverdent === '기타' &&
                              (fd.abutmentDirectInput ?? fd.abutmentPreset)
                              ? `오버덴취용 / ${fd.abutmentDirectInput ?? fd.abutmentPreset}`
                              : `오버덴취용 / ${fd.abutmentOverdent}`
                            : fd.abutmentType;
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
                                - 어벗: {abutmentLabel}{' '}
                                {fd.torque && `/ ${fd.torque}`}
                              </p>
                            )}

                            {fd.hexStatus && (
                              <p>
                                - HEX:{' '}
                                {fd.hexStatus === 'hex' ? 'Hex' : 'Non-Hex'}{' '}
                                {!fd.sizeNotEntered &&
                                  (fd.diameter != null ||
                                    fd.cuff != null ||
                                    fd.height != null) && (
                                    <>
                                      (ø={fd.diameter ?? '-'}, C=
                                      {fd.cuff ?? '-'}, H={fd.height ?? '-'})
                                    </>
                                  )}
                              </p>
                            )}

                            {fd.sizeNotEntered && <p>- 사이즈: 입력 안함</p>}
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
                    ) : (
                      <p className="text-muted-foreground">준비 중입니다</p>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        {/* 오른쪽 */}
        <div className="lg:col-span-2">
          <ToothChart
            selectedTeeth={selectedTeeth}
            onToggle={toggleTooth}
            onReset={handleResetTooth}
            emptyLabel="치식에서 치아를 먼저 선택 해주세요."
            sheetsForSelectedTooth={sheetsForSelectedTooth}
            onAddSheet={handleAddSheet}
            onUpdateSheetFormData={handleUpdateSheetFormData}
            activeSheetId={activeSheetId}
            onActiveSheetChange={setActiveSheetId}
            onRemoveSheet={handleRemoveSheet}
            savedTeeth={savedTeeth}
          />
        </div>
      </div>

      <PreInfoModal
        open={preInfoModalOpen}
        onOpenChange={(open) => {
          setPreInfoModalOpen(open);
          if (!open) setIsEditingPreInfo(false);
        }}
        mode={isEditingPreInfo ? 'full' : modalMode}
        initial={
          isEditingPreInfo
            ? (preInfo ?? undefined)
            : modalMode === 'dateOnly'
              ? { gender: existingPatientGender, birthDate: '', phm: [] }
              : (preInfo ?? undefined)
        }
        onComplete={handlePreInfoComplete}
      />

      <AlertModal
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="생성 취소"
        message="진료 기록 생성을 취소 하시겠습니까?"
        secondaryButton={{
          label: '닫기',
          onClick: () => setCancelConfirmOpen(false),
        }}
        primaryButton={{
          label: '생성 취소',
          onClick: handleCancelConfirm,
        }}
      />

      <AlertModal
        open={registerConfirmOpen}
        onOpenChange={setRegisterConfirmOpen}
        title="진료 기록 등록"
        message={
          <div>
            더 추가할 진료 기록이 없으신가요?
            <br /> 이대로 등록을 완료하시겠습니까?
          </div>
        }
        secondaryButton={{
          label: '취소',
          onClick: () => setRegisterConfirmOpen(false),
        }}
        primaryButton={{
          label: '등록',
          onClick: handleRegisterConfirm,
        }}
      />
    </div>
  );
}

export default function RecordCreatePage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-muted-foreground">로딩 중...</div>}
    >
      <CreateContent />
    </Suspense>
  );
}
