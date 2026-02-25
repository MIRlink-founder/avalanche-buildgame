import {
  Feature,
  FEATURES,
  UserContext,
  DataStats,
  AccessResult,
} from './features';

/**
 * 기능별 최소 데이터 요구사항
 * SETTLEMENTS 등 데이터 기준 접근에 사용 (REPORTS는 규칙에서 직접 처리)
 */
const DATA_REQUIREMENTS: Record<
  Feature,
  {
    medicalRecordCount?: number;
    paymentCount?: number;
    settlementCount?: number;
  }
> = {
  [FEATURES.REPORTS]: {},
  [FEATURES.SETTLEMENTS]: {
    settlementCount: 10,
  },
};

/**
 * 기능별 접근 체크 함수 타입
 */
type AccessChecker = (user: UserContext, dataStats?: DataStats) => AccessResult;

/**
 * 기능별 접근 체크 규칙
 */
const REPORTS_GATE_MIN_COUNT = 50;

const ACCESS_RULES: Record<Feature, AccessChecker> = {
  [FEATURES.REPORTS]: (user, dataStats) => {
    // 1. MASTER_ADMIN만 접근 가능
    if (user.role !== 'MASTER_ADMIN') {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_DATA_OR_PERMISSION',
        message: '데이터 리포트는 마스터 관리자만 사용할 수 있습니다.',
      };
    }

    // 2. 통계 없으면 거부 (병원 유형/건수 확인 불가)
    if (!dataStats || dataStats.hospitalType == null) {
      return {
        allowed: false,
        reason: 'DATA_UNAVAILABLE',
        message: '병원 정보를 확인할 수 없습니다. 다시 시도해 주세요.',
      };
    }

    // 3. 대학병원이면 무조건 허용
    if (dataStats.hospitalType === 'UNIVERSITY') {
      return { allowed: true };
    }

    // 4. 일반(GENERAL): PAID/ON-CHAINED 50건 이상일 때만 허용
    const count = dataStats.paidOrOnChainedRecordCount ?? 0;
    if (count >= REPORTS_GATE_MIN_COUNT) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'INSUFFICIENT_DATA_OR_PERMISSION',
      message: `데이터 리포트는 결제·온체인 등록 완료된 진료 기록이 ${REPORTS_GATE_MIN_COUNT}건 이상일 때 이용할 수 있습니다. (현재 ${count}건 등록)`,
    };
  },

  [FEATURES.SETTLEMENTS]: (user, dataStats) => {
    const requirement = DATA_REQUIREMENTS[FEATURES.SETTLEMENTS];

    if (dataStats) {
      const hasEnoughSettlements =
        !requirement.settlementCount ||
        (dataStats.settlementCount ?? 0) >= requirement.settlementCount;

      if (hasEnoughSettlements) {
        return { allowed: true };
      }
    }

    if (user.role === 'MASTER_ADMIN') {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'INSUFFICIENT_DATA_OR_PERMISSION',
      message: '정산 기능은 마스터 관리자만 사용할 수 있습니다.',
    };
  },
};

/**
 * 기능 접근 권한 체크
 *
 * @param feature - 체크할 기능
 * @param user - 사용자 컨텍스트
 * @param dataStats - 데이터 통계 (선택, 없으면 역할만으로 판단)
 * @returns 접근 제어 결과
 *
 * @example
 * ```typescript
 * // 데이터 통계 없이 체크 (역할만으로 판단)
 * const result1 = checkFeatureAccess(FEATURES.REPORTS, { role: 'DEPT_ADMIN' });
 *
 * // 데이터 통계 포함하여 체크
 * const result2 = checkFeatureAccess(
 *   FEATURES.REPORTS,
 *   { role: 'DEPT_ADMIN' },
 *   { medicalRecordCount: 150 }
 * );
 * // medicalRecordCount가 100 이상이므로 DEPT_ADMIN도 접근 가능
 * ```
 */
export function checkFeatureAccess(
  feature: Feature,
  user: UserContext,
  dataStats?: DataStats,
): AccessResult {
  const checker = ACCESS_RULES[feature];

  if (!checker) {
    return {
      allowed: false,
      reason: 'UNKNOWN_FEATURE',
      message: '알 수 없는 기능입니다.',
    };
  }

  return checker(user, dataStats);
}
