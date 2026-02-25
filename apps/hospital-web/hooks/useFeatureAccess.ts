'use client';

import { useEffect, useState } from 'react';
import { getPayloadFromToken } from '@/lib/decode-token';
import { checkFeatureAccess } from '@/lib/permissions/feature-access';
import { Feature, UserContext, DataStats, AccessResult } from '@/lib/permissions/features';

interface UseFeatureAccessOptions {
  /** 데이터 통계 (선택) */
  dataStats?: DataStats;
  /** 데이터 통계를 가져오는 비동기 함수 (선택) */
  fetchDataStats?: () => Promise<DataStats>;
}

interface UseFeatureAccessReturn extends AccessResult {
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 사용자 컨텍스트 */
  user: UserContext | null;
}

/**
 * 기능 접근 권한을 체크하는 React Hook
 *
 * @param feature - 체크할 기능
 * @param options - 옵션 (dataStats 또는 fetchDataStats)
 * @returns 접근 제어 결과
 *
 * @example
 * ```typescript
 * // 역할만으로 체크
 * const { allowed, isLoading } = useFeatureAccess(FEATURES.REPORTS);
 *
 * // 데이터 통계 포함하여 체크
 * const { allowed, isLoading } = useFeatureAccess(FEATURES.REPORTS, {
 *   dataStats: { medicalRecordCount: 150 }
 * });
 *
 * // 데이터 통계를 비동기로 가져와서 체크
 * const { allowed, isLoading } = useFeatureAccess(FEATURES.REPORTS, {
 *   fetchDataStats: async () => {
 *     const res = await fetch('/api/stats');
 *     return res.json();
 *   }
 * });
 * ```
 */
export function useFeatureAccess(
  feature: Feature,
  options?: UseFeatureAccessOptions
): UseFeatureAccessReturn {
  const [user, setUser] = useState<UserContext | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | undefined>(options?.dataStats);
  const [isLoading, setIsLoading] = useState(true);
  const [accessResult, setAccessResult] = useState<AccessResult>({
    allowed: false,
    reason: 'LOADING',
    message: '권한을 확인하는 중입니다...',
  });

  useEffect(() => {
    async function checkAccess() {
      setIsLoading(true);

      try {
        // 1. 토큰에서 사용자 정보 가져오기
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setAccessResult({
            allowed: false,
            reason: 'NO_TOKEN',
            message: '로그인이 필요합니다.',
          });
          setIsLoading(false);
          return;
        }

        const payload = getPayloadFromToken(token);
        if (!payload || !payload.role) {
          setAccessResult({
            allowed: false,
            reason: 'INVALID_TOKEN',
            message: '유효하지 않은 인증 정보입니다.',
          });
          setIsLoading(false);
          return;
        }

        const userContext: UserContext = {
          role: payload.role,
          email: payload.email,
          hospitalId: payload.hospitalId,
        };
        setUser(userContext);

        // 2. 데이터 통계 가져오기 (옵션)
        let stats = options?.dataStats;
        if (options?.fetchDataStats && !stats) {
          stats = await options.fetchDataStats();
          setDataStats(stats);
        }

        // 3. 접근 권한 체크
        const result = checkFeatureAccess(feature, userContext, stats);
        setAccessResult(result);
      } catch (error) {
        console.error('Failed to check feature access:', error);
        setAccessResult({
          allowed: false,
          reason: 'ERROR',
          message: '권한 확인 중 오류가 발생했습니다.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [feature, options?.dataStats, options?.fetchDataStats]);

  return {
    ...accessResult,
    isLoading,
    user,
  };
}
