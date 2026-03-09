'use client';

import type { ToothState } from '@/lib/record-types';
import { getToothImagePath } from './tooth-image-paths';

// 치식도 4줄 (hospital-web ToothChart과 동일)
const TOOTH_ROWS: number[][] = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

const TOOTH_CELL_SIZE = 36;

interface ToothChartReadOnlyProps {
  savedTeeth: number[];
  selectedTooth?: number | null;
  onToothSelect?: (tooth: number | null) => void;
  implantRemovedTeeth?: number[];
}

export function ToothChartReadOnly({
  savedTeeth,
  selectedTooth = null,
  onToothSelect = () => {},
  implantRemovedTeeth = [],
}: ToothChartReadOnlyProps) {
  const savedSet = new Set(savedTeeth);
  const implantRemovedSet = new Set(implantRemovedTeeth);

  function getToothState(tooth: number): ToothState {
    if (implantRemovedSet.has(tooth)) return 'implant_removed';
    if (savedSet.has(tooth)) return 'has_value';
    if (selectedTooth === tooth) return 'selected';
    return 'empty';
  }

  return (
    <div
      className="flex flex-col items-start overflow-x-auto border rounded-lg p-6"
      aria-label="시술 부위 치식도"
    >
      <div className="min-w-max flex flex-col items-center gap-2">
      {TOOTH_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex justify-start gap-1"
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
                onClick={() => onToothSelect(selected ? null : tooth)}
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
    </div>
  );
}
