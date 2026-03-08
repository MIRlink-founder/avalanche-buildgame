import type { ToothState } from './treatment-sheet-types';

const TOOTH_IMAGE_BASE = '/assets/tooths';

// 치아 번호 → 상악(upper) / 하악(lower). 영구치 11-28/31-48, 유치 51-65/71-85
function getJaw(tooth: number): 'upper' | 'lower' {
  if (tooth >= 11 && tooth <= 28) return 'upper';
  if (tooth >= 51 && tooth <= 65) return 'upper'; // 유치 상악 51-55, 61-65
  return 'lower'; // 31-48, 71-85
}

// 치아 번호 → 구역 (전치/소구치/대구치). FDI 일의 자리 기준
function getRegion(tooth: number): 'front' | 'premolars' | 'molars' {
  const digit = tooth % 10;
  if (digit <= 3) return 'front';
  if (digit <= 5) return 'premolars';
  return 'molars';
}

export function getToothImagePath(tooth: number, state: ToothState): string {
  const jaw = getJaw(tooth);
  const base = `${TOOTH_IMAGE_BASE}/${jaw}`;

  if (state === 'has_value') return `${base}/has_value.svg`;
  if (state === 'implant_removed') return `${base}/implant_remove.svg`;

  const region = getRegion(tooth);
  return `${base}/${region}_${state}.svg`;
}

export { TOOTH_IMAGE_BASE };
