'use client';

import { Badge, Button } from '@mire/ui';
import { RotateCcw, Trash, X } from 'lucide-react';
import { getToothImagePath } from './tooth-image-paths';
import { ImplantPlacementSheet } from './ImplantPlacementSheet';
import type { ImplantItemOption } from './ImplantPlacementSheet';
import { ImplantProsthesisSheet } from './ImplantProsthesisSheet';
import { LaminateSheet } from './LaminateSheet';
import type {
  TreatmentSheet,
  TreatmentSheetType,
  ToothState,
  ImplantPlacementFormData,
  ImplantProsthesisFormData,
  LaminateFormData,
  ImplantRemoveFormData,
} from './treatment-sheet-types';
import { ImplantRemoveSheet } from './ImplantRemoveSheet';

// 치식도 4줄
const TOOTH_ROWS: number[][] = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

const TOOTH_CELL_SIZE = 56;

const TREATMENT_TYPE_LABELS: Record<TreatmentSheetType, string> = {
  implant_placement: '임플란트 식립',
  implant_prosthesis: '임플란트 보철',
  implant_remove: '임플란트 제거',
  laminate: '라미네이트',
};

export interface ToothChartProps {
  selectedTeeth: number | null;
  onToggle: (tooth: number) => void;
  onReset?: () => void;
  emptyLabel?: string;
  sheetsForSelectedTooth?: TreatmentSheet[]; // 선택된 치아에 대한 진료 시트 목록
  onAddSheet?: (tooth: number, type: TreatmentSheetType) => void;
  onUpdateSheetFormData?: (
    sheetId: string,
    formData: TreatmentSheet['formData'],
  ) => void;
  activeSheetId?: string | 'add';
  onActiveSheetChange?: (id: string | 'add') => void;
  onRemoveSheet?: (sheetId: string) => void;
  savedTeeth?: number[]; // 임시 저장된 데이터가 있는 치아 번호
  implantRemovedTeeth?: number[];
  readOnly?: boolean;
  implantItems?: ImplantItemOption[];
  onFixtureListChange?: () => void;
}

export function ToothChart({
  selectedTeeth,
  onToggle,
  onReset,
  emptyLabel = '치식에서 치아를 먼저 선택 해주세요.',
  sheetsForSelectedTooth = [],
  onAddSheet,
  onUpdateSheetFormData,
  activeSheetId = 'add',
  onActiveSheetChange,
  onRemoveSheet,
  savedTeeth = [],
  implantRemovedTeeth = [],
  readOnly = false,
  implantItems = [],
  onFixtureListChange,
}: ToothChartProps) {
  const savedSet = new Set(savedTeeth);
  const implantRemovedSet = new Set(implantRemovedTeeth);

  /** 치아별 표시 상태 (이미지 경로·스타일 결정) */
  function getToothState(tooth: number): ToothState {
    if (implantRemovedSet.has(tooth)) return 'implant_removed';
    if (savedSet.has(tooth)) return 'has_value'; // 저장된 치아는 선택돼도 has_value 이미지 유지
    if (selectedTeeth === tooth) return 'selected';
    return 'empty';
  }

  return (
    <div className="flex flex-col space-y-6 py-6 h-full">
      <div className="flex items-center justify-end">
        {onReset && !readOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            초기화
          </Button>
        )}
      </div>

      {/* 치식 그리드: 4줄 격자, 일정 간격 */}
      <div className="flex flex-col items-center gap-2 overflow-x-auto">
        {TOOTH_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center gap-1"
            role="row"
            aria-label={
              rowIndex === 0
                ? '상악 영구치'
                : rowIndex === 1
                  ? '상악 유치'
                  : rowIndex === 2
                    ? '하악 유치'
                    : '하악 영구치'
            }
          >
            {row.map((tooth) => {
              const state = getToothState(tooth);
              const selected = state === 'selected';
              const imageHref = getToothImagePath(tooth, state);
              const label =
                state === 'implant_removed'
                  ? `${tooth} Ext`
                  : state === 'has_value'
                    ? `IMPL ${tooth}`
                    : String(tooth);
              const textColorClass =
                state === 'empty'
                  ? 'text-muted-foreground'
                  : state === 'selected'
                    ? 'text-primary'
                    : state === 'has_value'
                      ? 'text-white'
                      : 'text-destructive';
              return (
                <button
                  key={tooth}
                  type="button"
                  className="flex flex-col items-center justify-center shrink-0 rounded transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    width: TOOTH_CELL_SIZE,
                    height: TOOTH_CELL_SIZE,
                  }}
                  aria-pressed={selected}
                  aria-label={`치아 ${tooth}`}
                  data-tooth={tooth}
                  onClick={() => onToggle(tooth)}
                >
                  <span className="relative block w-full h-full">
                    <img
                      src={imageHref}
                      alt=""
                      width={TOOTH_CELL_SIZE}
                      height={TOOTH_CELL_SIZE}
                      className="object-contain w-full h-full pointer-events-none"
                    />
                    <span
                      className={`absolute inset-0 flex flex-col justify-center text-sm font-medium leading-tight ${textColorClass}`}
                    >
                      {state === 'has_value' ? (
                        <div
                          className={`text-[10px] flex flex-col h-[70%] ${rowIndex < 2 ? '' : 'justify-end'}`}
                        >
                          <span>IMPL</span>
                          <span>{tooth}</span>
                        </div>
                      ) : state === 'implant_removed' ? (
                        <div className="text-[11px] flex flex-col">
                          <span>{tooth}</span>
                          <span>Ext</span>
                        </div>
                      ) : (
                        label
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="font-medium text-foreground">
        선택된 치아 <Badge className="ml-1">#{selectedTeeth ?? '-'}</Badge>
      </p>

      <div className="h-full flex-1 min-h-0 overflow-auto flex flex-col rounded-lg border border-border bg-background">
        {selectedTeeth === null ? (
          <div className="p-3 flex-1">
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : (
          <>
            {/* 탭: 시트별 탭 + "+ 새 진료 추가" */}
            <div className="flex border-b border-border shrink-0">
              {sheetsForSelectedTooth.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`inline-flex items-center gap-1 border-b-2 -mb-px ${
                    activeSheetId === sheet.id
                      ? 'border-primary bg-muted/30'
                      : 'border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onActiveSheetChange?.(sheet.id)}
                    className={`pl-3 ${readOnly && 'pr-3'} py-2 text-sm font-medium transition-colors ${
                      activeSheetId === sheet.id
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {TREATMENT_TYPE_LABELS[sheet.type]}
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSheet?.(sheet.id);
                      }}
                      className="pr-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      aria-label={`${TREATMENT_TYPE_LABELS[sheet.type]} 제거`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onActiveSheetChange?.('add')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeSheetId === 'add'
                      ? 'border-primary text-foreground bg-muted/30'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  + 새 진료 추가
                </button>
              )}
            </div>
            {/* 탭 내용: "add"일 때만 3버튼, 아니면 해당 시트 폼 */}
            <div className="p-3 flex-1 min-h-0 overflow-auto">
              {activeSheetId === 'add' && !readOnly ? (
                <div className="flex flex-col gap-4 justify-center items-center h-full">
                  <div className="font-medium">
                    기록할 수술의 종류를 선택해주세요.
                  </div>
                  <div className="flex justify-center gap-4 items-center">
                    {(
                      [
                        'implant_placement',
                        'implant_prosthesis',
                        'implant_remove',
                      ] as const
                    ).map((type) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="xl"
                        className="border-primary border-2 hover:bg-primary/10 h-20 w-40"
                        onClick={() => onAddSheet?.(selectedTeeth, type)}
                      >
                        {type === 'implant_remove' ? '🗑️' : '🦷'}{' '}
                        {TREATMENT_TYPE_LABELS[type]}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const sheet = sheetsForSelectedTooth.find(
                    (s) => s.id === activeSheetId,
                  );
                  if (!sheet)
                    return readOnly ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        치아를 선택하면 진료 내용을 볼 수 있습니다.
                      </div>
                    ) : null;
                  if (sheet.type === 'implant_placement') {
                    return (
                      <ImplantPlacementSheet
                        value={
                          (sheet.formData ?? {}) as ImplantPlacementFormData
                        }
                        onChange={(formData) =>
                          onUpdateSheetFormData?.(sheet.id, formData)
                        }
                        readOnly={readOnly}
                        implantItems={implantItems}
                        onFixtureListChange={onFixtureListChange}
                      />
                    );
                  }
                  if (sheet.type === 'implant_prosthesis') {
                    return (
                      <ImplantProsthesisSheet
                        value={
                          (sheet.formData ?? {}) as ImplantProsthesisFormData
                        }
                        onChange={(formData) =>
                          onUpdateSheetFormData?.(sheet.id, formData)
                        }
                        readOnly={readOnly}
                      />
                    );
                  }
                  if (sheet.type === 'implant_remove') {
                    return (
                      <ImplantRemoveSheet
                        value={(sheet.formData ?? {}) as ImplantRemoveFormData}
                        onChange={(formData) =>
                          onUpdateSheetFormData?.(sheet.id, formData)
                        }
                        readOnly={readOnly}
                      />
                    );
                  }
                  return (
                    <p className="text-sm text-muted-foreground py-4">
                      준비 중입니다
                    </p>
                  );
                })()
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
