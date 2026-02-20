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

export function formatDateOnly(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '';
  if (bytes >= 1024 * 1024) return `(${(bytes / (1024 * 1024)).toFixed(1)}MB)`;
  if (bytes >= 1024) return `(${(bytes / 1024).toFixed(1)}KB)`;
  return `(${bytes}B)`;
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

/** 병원 소속 사용자 역할 라벨 (계정 관리 탭용) */
export const USER_ROLE_LABELS: Record<string, string> = {
  MASTER_ADMIN: '마스터 관리자',
  DEPT_ADMIN: '부서 관리자',
  SUB_ADMIN: '운영사 부관리자',
  SUPER_ADMIN: '운영사 관리자',
};

/** 계정 관리 테이블 권한 표기 (관리자/일반) */
export const ACCOUNT_ROLE_LABELS: Record<string, string> = {
  MASTER_ADMIN: '관리자',
  DEPT_ADMIN: '일반',
  SUB_ADMIN: '운영사 부관리자',
  SUPER_ADMIN: '운영사 관리자',
};

/** 사용자 역할 뱃지 색상 (계정 관리 등) */
export const USER_ROLE_COLORS: Record<string, string> = {
  MASTER_ADMIN: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  DEPT_ADMIN: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  SUB_ADMIN: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  SUPER_ADMIN: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

/** 사용자 계정 상태 라벨 */
export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '정상',
  DISABLED: '정지',
  DELETED: '삭제됨',
  WITHDRAWN: '탈퇴',
};

/** 계정 관리 테이블 상태 표기 (정상/초대대기/비활성화) */
export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '정상',
  DISABLED: '비활성화',
  DELETED: '삭제됨',
  WITHDRAWN: '탈퇴',
  PENDING: '초대대기',
};

/** 사용자 계정 상태 뱃지 색상 */
export const USER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  DISABLED: 'bg-red-100 text-red-800 hover:bg-red-100',
  DELETED: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  WITHDRAWN: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};
