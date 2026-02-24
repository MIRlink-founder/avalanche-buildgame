/**
 * 애플리케이션의 기능 목록
 */
export const FEATURES = {
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  SETTLEMENTS: 'settlements',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * 사용자 컨텍스트
 */
export interface UserContext {
  role: string;
  email?: string;
  hospitalId?: string | null;
}

/**
 * 데이터 통계 (적재된 데이터의 양)
 */
export interface DataStats {
  /** 진료 기록 수 */
  medicalRecordCount?: number;
  /** 결제 수 */
  paymentCount?: number;
  /** 정산 수 */
  settlementCount?: number;
  // 향후 추가될 수 있는 통계들
}

/**
 * 접근 제어 결과
 */
export interface AccessResult {
  /** 접근 허용 여부 */
  allowed: boolean;
  /** 거부 사유 (allowed가 false일 때) */
  reason?: string;
  /** 사용자에게 표시할 메시지 */
  message?: string;
}
