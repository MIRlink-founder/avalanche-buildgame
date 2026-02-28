'use client';

import {
  QUADRANT_18_11,
  QUADRANT_21_28,
  QUADRANT_48_41,
  QUADRANT_31_38,
  VIEWBOX_18_11,
  VIEWBOX_21_28,
  VIEWBOX_48_41,
  VIEWBOX_31_38,
} from './frame-tooth-paths';

type PathItem = { tooth: number; d: string; cx: number; cy: number };

interface ToothChartReadOnlyProps {
  /** 시술된 치아 번호 목록 (강조 표시) */
  savedTeeth: number[];
  /** 선택된 치아 (클릭 시 해당 치아만 상세 표시) */
  selectedTooth?: number | null;
  /** 치아 클릭 시 호출. 동일 치아 재클릭 시 null로 해제 */
  onToothSelect?: (tooth: number | null) => void;
}

function QuadrantSvg({
  paths,
  viewBox,
  savedSet,
  selectedTooth,
  onToothSelect,
}: {
  paths: PathItem[];
  viewBox: string;
  savedSet: Set<number>;
  selectedTooth: number | null;
  onToothSelect: (tooth: number | null) => void;
}) {
  return (
    <svg
      viewBox={viewBox}
      className="w-full min-w-0 flex-1 w-full h-auto"
      aria-label="치식도 구역"
    >
      {paths.map(({ tooth, d, cx, cy }) => {
        const hasSaved = savedSet.has(tooth);
        const selected = selectedTooth === tooth;
        const fill = selected
          ? 'color-mix(in srgb, var(--primary) 70%, transparent)'
          : hasSaved
            ? 'color-mix(in srgb, var(--primary) 50%, transparent)'
            : 'color-mix(in srgb, var(--muted-foreground) 20%, transparent)';
        const stroke = selected
          ? 'var(--primary)'
          : hasSaved
            ? 'var(--primary)'
            : 'color-mix(in srgb, var(--muted-foreground) 20%, transparent)';
        return (
          <g key={tooth}>
            <path
              d={d}
              fill={fill}
              stroke={stroke}
              strokeWidth={selected || hasSaved ? 2 : 1}
              className="transition-colors cursor-pointer hover:opacity-90"
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`치아 ${tooth}${selected ? ' 선택됨' : ''}`}
              onClick={() => onToothSelect(selected ? null : tooth)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToothSelect(selected ? null : tooth);
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
  );
}

export function ToothChartReadOnly({
  savedTeeth,
  selectedTooth = null,
  onToothSelect = () => {},
}: ToothChartReadOnlyProps) {
  const savedSet = new Set(savedTeeth);
  return (
    <div
      className="flex flex-col gap-4 overflow-x-auto border rounded-lg p-8"
      aria-label="시술 부위 치식도"
    >
      {/* 상악: 18-11 | 21-28 */}
      <div className="flex flex-col gap-1">
        <p className="text-center font-medium text-muted-foreground">
          상악 (Upper)
        </p>
        <div className="flex flex-col gap-2 w-full">
          <QuadrantSvg
            paths={QUADRANT_18_11}
            viewBox={VIEWBOX_18_11}
            savedSet={savedSet}
            selectedTooth={selectedTooth}
            onToothSelect={onToothSelect}
          />
          <QuadrantSvg
            paths={QUADRANT_21_28}
            viewBox={VIEWBOX_21_28}
            savedSet={savedSet}
            selectedTooth={selectedTooth}
            onToothSelect={onToothSelect}
          />
        </div>
      </div>
      {/* 하악: 48-41 | 31-38 */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-2 w-full">
          <QuadrantSvg
            paths={QUADRANT_48_41}
            viewBox={VIEWBOX_48_41}
            savedSet={savedSet}
            selectedTooth={selectedTooth}
            onToothSelect={onToothSelect}
          />
          <QuadrantSvg
            paths={QUADRANT_31_38}
            viewBox={VIEWBOX_31_38}
            savedSet={savedSet}
            selectedTooth={selectedTooth}
            onToothSelect={onToothSelect}
          />
        </div>
        <p className="text-center font-medium text-muted-foreground">
          하악 (Lower)
        </p>
      </div>
    </div>
  );
}
