// 진료 기록 view/create 에서 사용하는 세션 키
export const SESSION_KEY_RECORD_PATIENT_ID = 'recordPatientId';
export const SESSION_KEY_RECORD_PIN_CODE = 'recordPinCode';

// 구분자
export const BARCODE_PATIENT_PIN_SEPARATOR = '#';

export interface ParsedBarcode {
  patientId: string;
  pin: string;
}

// 바코드 문자열을 구분자로 파싱해 patientId와 PIN을 반환
export function parseBarcode(barcode: string): ParsedBarcode | null {
  const trimmed = barcode.trim();
  if (!trimmed) return null;
  const idx = trimmed.indexOf(BARCODE_PATIENT_PIN_SEPARATOR);
  if (idx === -1) return null;
  const patientId = trimmed.slice(0, idx).trim();
  const pin = trimmed.slice(idx + 1).trim();
  if (!patientId || !pin) return null;
  return { patientId, pin };
}

// 더미 바코드 (patientId#pin 형식)
export const DUMMY_BARCODE = 'DUMMYID#123456';
