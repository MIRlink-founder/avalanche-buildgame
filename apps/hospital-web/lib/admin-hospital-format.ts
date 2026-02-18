// 병원 관리(admin) 공통: 포맷 유틸 + 상태 라벨/색상

export function formatDate(date: Date): string {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBusinessNumber(num: string): string {
  if (num.length === 10) {
    return `${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
  }
  return num;
}

export function formatPhone(phone: string | null): string {
  if (!phone) return '-';
  if (phone.startsWith('02')) {
    if (phone.length === 9) {
      return `${phone.slice(0, 2)}-${phone.slice(2, 5)}-${phone.slice(5)}`;
    }
    return `${phone.slice(0, 2)}-${phone.slice(2, 6)}-${phone.slice(6)}`;
  }
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

export const HOSPITAL_STATUS_LABELS: Record<string, string> = {
  PENDING: '승인대기',
  APPROVED: '승인완료',
  ACTIVE: '정상',
  REJECTED: '반려',
  DISABLED: '정지',
  WITHDRAWN: '탈퇴',
};

export const HOSPITAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  APPROVED: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  ACTIVE: 'bg-blue-600 text-white hover:bg-blue-600',
  REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
  DISABLED: 'bg-red-600 text-white hover:bg-red-600',
  WITHDRAWN: 'bg-gray-400 text-white hover:bg-gray-400',
};
