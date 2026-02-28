// URL 해시에서 pinCode 추출 (# 제거)
export function getPinCodeFromHash(): string {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash;
  if (!hash || hash === '#') return '';
  return hash.slice(1).trim();
}

// 현재 URL에서 patientId + pinCode 조합
export function getPatientContextFromUrl(): {
  patientId: string;
  pinCode: string;
} {
  if (typeof window === 'undefined') return { patientId: '', pinCode: '' };
  const params = new URLSearchParams(window.location.search);
  const patientId = params.get('patientId')?.trim() ?? '';
  const pinCode = getPinCodeFromHash();
  return { patientId, pinCode };
}
