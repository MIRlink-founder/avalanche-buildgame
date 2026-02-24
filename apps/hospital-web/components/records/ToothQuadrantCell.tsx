'use client';

const FDI_TO_UI_QUADRANT = [0, 1, 3, 2] as const; // FDI 1→좌상, 2→우상, 3→우하, 4→좌하 (그리드 셀 인덱스)

export function ToothQuadrantCell({ tooth }: { tooth: number }) {
  const quadrant = Math.floor(tooth / 10); // FDI 1~4
  const digit = tooth % 10;
  const cellIndex = FDI_TO_UI_QUADRANT[quadrant - 1] ?? 0;
  return (
    <div className="relative w-16 h-8 grid grid-cols-2 grid-rows-2 gap-0 text-[10px] font-medium text-foreground">
      {/* 2×2: [1사][2사] / [3사][4사] */}
      <span className="flex items-center justify-center">
        {cellIndex === 0 ? digit : ''}
      </span>
      <span className="flex items-center justify-center">
        {cellIndex === 1 ? digit : ''}
      </span>
      <span className="flex items-center justify-center">
        {cellIndex === 2 ? digit : ''}
      </span>
      <span className="flex items-center justify-center">
        {cellIndex === 3 ? digit : ''}
      </span>
      {/* 십자가 */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        aria-hidden
      >
        <div className="w-full h-px bg-border" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        aria-hidden
      >
        <div className="w-px h-full bg-border" />
      </div>
    </div>
  );
}
