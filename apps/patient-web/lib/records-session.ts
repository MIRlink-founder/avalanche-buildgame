// 환자 웹 진료 기록 세션 키 (hospital-web과 동일 키 사용)
export const SESSION_KEY_RECORD_PATIENT_ID = 'recordPatientId';
export const SESSION_KEY_RECORD_PIN_CODE = 'recordPinCode';
// 로그인 성공 시 설정, 15분 후 만료 — 이 값이 없거나 만료되면 /record 접근 불가
export const SESSION_KEY_RECORD_EXPIRES_AT = 'recordSessionExpiresAt';

const RECORD_SESSION_TTL_MS = 15 * 60 * 1000; // 15분

export function setRecordSession(patientId: string, pinCode: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY_RECORD_PATIENT_ID, patientId);
  sessionStorage.setItem(SESSION_KEY_RECORD_PIN_CODE, pinCode);
}

// 로그인(또는 비밀번호 설정) 성공 시 호출 — 15분 후 만료 시각 저장
export function setRecordSessionExpiresAt(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    SESSION_KEY_RECORD_EXPIRES_AT,
    String(Date.now() + RECORD_SESSION_TTL_MS),
  );
}

// 랜딩 외 페이지용: 세션에서 patientId 조회
export function getPatientIdFromSession(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(SESSION_KEY_RECORD_PATIENT_ID)?.trim() ?? '';
}

// 세션에서 patientId + pinCode 한 번에 조회
export function getRecordSession(): { patientId: string; pinCode: string } {
  if (typeof window === 'undefined') return { patientId: '', pinCode: '' };
  return {
    patientId:
      sessionStorage.getItem(SESSION_KEY_RECORD_PATIENT_ID)?.trim() ?? '',
    pinCode: sessionStorage.getItem(SESSION_KEY_RECORD_PIN_CODE)?.trim() ?? '',
  };
}

// 로그인 유효 여부 — recordSessionExpiresAt 존재 및 미만료. 만료 시 키 제거 후 false
export function isRecordSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = sessionStorage.getItem(SESSION_KEY_RECORD_EXPIRES_AT);
  if (!raw || raw.trim() === '') return false;
  const expiresAt = Number(raw);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) {
    sessionStorage.removeItem(SESSION_KEY_RECORD_EXPIRES_AT);
    return false;
  }
  return true;
}

// 세션 강제 종료 (QR 스캔하기 / 비밀번호 재설정 플로우용)
export function clearRecordSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY_RECORD_PATIENT_ID);
  sessionStorage.removeItem(SESSION_KEY_RECORD_PIN_CODE);
  sessionStorage.removeItem(SESSION_KEY_RECORD_EXPIRES_AT);
}
