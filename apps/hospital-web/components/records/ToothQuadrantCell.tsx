'use client';

const FDI_TO_UI_QUADRANT = [0, 1, 3, 2] as const; // FDI 1→좌상, 2→우상, 3→우하, 4→좌하 (그리드 셀 인덱스)
const DIGIT_TO_LETTER: Record<number, string> = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
};

export function ToothQuadrantCell({ tooth }: { tooth: number }) {
  const quadrant = Math.floor(tooth / 10); // FDI 1~4
  const digit = tooth % 10;
  const showLetter = quadrant >= 5 && quadrant <= 8;
  const displayValue =
    showLetter && digit in DIGIT_TO_LETTER
      ? DIGIT_TO_LETTER[digit as 1 | 2 | 3 | 4 | 5]
      : String(digit);
  const cellIndex = FDI_TO_UI_QUADRANT[quadrant - 1] ?? 0;

  return (
    <div className="relative w-16 h-8 grid grid-cols-2 grid-rows-2 gap-0 text-[10px] font-medium text-foreground">
      {/* 2×2: [1사][2사] / [3사][4사] */}
      <span className="flex items-center justify-center">
        {cellIndex === 0 ? displayValue : ''}
      </span>
      <span className="flex items-center justify-center">
        {cellIndex === 1 ? displayValue : ''}
      </span>
      <span className="flex items-center justify-center">
        {cellIndex === 2 ? displayValue : ''}
      </span>
      <span className="flex items-center justify-center">
        {cellIndex === 3 ? displayValue : ''}
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
