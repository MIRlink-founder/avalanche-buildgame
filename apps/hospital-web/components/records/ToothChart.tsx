'use client';

import { Badge, Button } from '@mire/ui';
import { RotateCcw, X } from 'lucide-react';
import { FRAME_TOOTH_PATHS } from './frame-tooth-paths';
import { ImplantPlacementSheet } from './ImplantPlacementSheet';
import { ImplantProsthesisSheet } from './ImplantProsthesisSheet';
import { LaminateSheet } from './LaminateSheet';
import type {
  TreatmentSheet,
  TreatmentSheetType,
  ImplantPlacementFormData,
  ImplantProsthesisFormData,
  LaminateFormData,
} from './treatment-sheet-types';

const TREATMENT_TYPE_LABELS: Record<TreatmentSheetType, string> = {
  implant_placement: '임플란트 식립',
  implant_prosthesis: '임플란트 보철',
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
  readOnly?: boolean;
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
  readOnly = false,
}: ToothChartProps) {
  const savedSet = new Set(savedTeeth);

  return (
    <div className="flex flex-col space-y-4 py-6 h-full">
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

      {/* 치식 그리드: 저장된 치아는 붉은색, 선택된 치아는 primary */}
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox="0 0 758 140"
          className="w-full max-w-full min-w-[280px] h-auto"
          aria-label="치식도"
        >
          {FRAME_TOOTH_PATHS.map(({ tooth, d, cx, cy }) => {
            const selected = selectedTeeth === tooth;
            const hasSaved = savedSet.has(tooth);
            const fill = selected
              ? 'color-mix(in srgb, var(--primary) 50%, transparent)'
              : hasSaved
                ? 'color-mix(in srgb, hsl(0 84% 60%) 50%, transparent)'
                : 'color-mix(in srgb, var(--muted-foreground) 20%, transparent)';
            const stroke = selected
              ? 'color-mix(in srgb, var(--primary) 50%, transparent)'
              : hasSaved
                ? 'hsl(0 84% 60%)'
                : 'color-mix(in srgb, var(--muted-foreground) 20%, transparent)';
            return (
              <g key={tooth}>
                <path
                  d={d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={selected || hasSaved ? 2 : 1}
                  className="cursor-pointer transition-colors hover:opacity-90 outline-none focus:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`치아 ${tooth}`}
                  data-tooth={tooth}
                  onClick={() => onToggle(tooth)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggle(tooth);
                    }
                  }}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground text-[10px] font-medium pointer-events-none"
                >
                  {tooth}
                </text>
              </g>
            );
          })}
        </svg>
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
                    className={`pl-3 py-2 text-sm font-medium transition-colors ${
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
                      className="rounded hover:bg-muted text-muted-foreground hover:text-foreground"
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
                        'laminate',
                      ] as const
                    ).map((type) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="xl"
                        className="border-primary border-2 hover:bg-primary/20 h-20 w-40"
                        onClick={() => onAddSheet?.(selectedTeeth, type)}
                      >
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
                  if (sheet.type === 'laminate') {
                    return (
                      <LaminateSheet
                        value={(sheet.formData ?? {}) as LaminateFormData}
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
