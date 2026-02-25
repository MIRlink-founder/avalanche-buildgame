// 생년월일 8자리 → 표시용 (YYYY.MM.DD)
export function formatBirthDateDisplay(birthDate: string): string {
  if (!birthDate || birthDate.length !== 8) return birthDate || '-';
  return `${birthDate.slice(0, 4)}.${birthDate.slice(4, 6)}.${birthDate.slice(6, 8)}`;
}

// 상악 치식 번호 (18~11, 21~28)
export const UPPER_TEETH = [
  ...Array.from({ length: 8 }, (_, i) => 18 - i),
  ...Array.from({ length: 8 }, (_, i) => 21 + i),
];

// 하악 치식 번호 (48~41, 31~38)
export const LOWER_TEETH = [
  ...Array.from({ length: 8 }, (_, i) => 48 - i),
  ...Array.from({ length: 8 }, (_, i) => 31 + i),
];
