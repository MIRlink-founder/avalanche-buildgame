import { Feature, FEATURES, UserContext, DataStats, AccessResult } from './features';

/**
 * 기능별 최소 데이터 요구사항
 * 이 기준을 만족하면 역할과 관계없이 접근 가능
 */
const DATA_REQUIREMENTS: Record<Feature, { medicalRecordCount?: number; paymentCount?: number; settlementCount?: number }> = {
  [FEATURES.REPORTS]: {
    medicalRecordCount: 100, // 진료 기록 100건 이상
    // paymentCount: 50, // 결제 50건 이상 (필요시 활성화)
  },
  [FEATURES.ANALYTICS]: {
    medicalRecordCount: 50,
  },
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
const ACCESS_RULES: Record<Feature, AccessChecker> = {
  [FEATURES.REPORTS]: (user, dataStats) => {
    const requirement = DATA_REQUIREMENTS[FEATURES.REPORTS];

    // 1단계: 데이터 적재 수 체크 (우선순위)
    if (dataStats) {
      const hasEnoughRecords =
        !requirement.medicalRecordCount ||
        (dataStats.medicalRecordCount ?? 0) >= requirement.medicalRecordCount;

      if (hasEnoughRecords) {
        return { allowed: true };
      }
    }

    // 2단계: 데이터가 부족하면 MASTER_ADMIN만 접근 가능
    if (user.role === 'MASTER_ADMIN') {
      return { allowed: true };
    }

    // 기본: 거부
    return {
      allowed: false,
      reason: 'INSUFFICIENT_DATA_OR_PERMISSION',
      message: '리포트 기능은 마스터 관리자만 사용할 수 있습니다.',
    };
  },

  [FEATURES.ANALYTICS]: (user, dataStats) => {
    const requirement = DATA_REQUIREMENTS[FEATURES.ANALYTICS];

    if (dataStats) {
      const hasEnoughRecords =
        !requirement.medicalRecordCount ||
        (dataStats.medicalRecordCount ?? 0) >= requirement.medicalRecordCount;

      if (hasEnoughRecords) {
        return { allowed: true };
      }
    }

    if (user.role === 'MASTER_ADMIN') {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'INSUFFICIENT_DATA_OR_PERMISSION',
      message: '분석 기능은 마스터 관리자만 사용할 수 있습니다.',
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
  dataStats?: DataStats
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
