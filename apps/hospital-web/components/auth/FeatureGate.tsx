'use client';

import { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Feature, DataStats } from '@/lib/permissions/features';
import { UnauthorizedOverlay } from './UnauthorizedOverlay';

interface FeatureGateProps {
  /** 체크할 기능 */
  feature: Feature;
  /** 자식 컴포넌트 */
  children: ReactNode;
  /** 데이터 통계 (선택) */
  dataStats?: DataStats;
  /** 데이터 통계를 가져오는 비동기 함수 (선택) */
  fetchDataStats?: () => Promise<DataStats>;
  /** 접근 거부 시 표시할 커스텀 메시지 (선택) */
  deniedMessage?: string;
  /** 접근 거부 시 표시할 커스텀 폴백 컴포넌트 (선택) */
  fallback?: ReactNode;
  /** 로딩 중 표시할 컴포넌트 (선택) */
  loading?: ReactNode;
}

/**
 * 기능 접근 제어 게이트 컴포넌트
 * 권한이 있는 사용자만 자식 컴포넌트를 볼 수 있음
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <FeatureGate feature={FEATURES.REPORTS}>
 *   <ReportsContent />
 * </FeatureGate>
 *
 * // 데이터 통계 포함
 * <FeatureGate
 *   feature={FEATURES.REPORTS}
 *   dataStats={{ medicalRecordCount: 150 }}
 * >
 *   <ReportsContent />
 * </FeatureGate>
 *
 * // 비동기 데이터 통계
 * <FeatureGate
 *   feature={FEATURES.REPORTS}
 *   fetchDataStats={async () => {
 *     const res = await fetch('/api/stats');
 *     return res.json();
 *   }}
 * >
 *   <ReportsContent />
 * </FeatureGate>
 *
 * // 커스텀 메시지
 * <FeatureGate
 *   feature={FEATURES.REPORTS}
 *   deniedMessage="진료 기록이 100건 이상이어야 사용할 수 있습니다."
 * >
 *   <ReportsContent />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  dataStats,
  fetchDataStats,
  deniedMessage,
  fallback,
  loading,
}: FeatureGateProps) {
  const { allowed, isLoading, message } = useFeatureAccess(feature, {
    dataStats,
    fetchDataStats,
  });

  // 로딩 중
  if (isLoading) {
    return <>{loading ?? null}</>;
  }

  // 접근 허용
  if (allowed) {
    return <>{children}</>;
  }

  // 접근 거부 - 커스텀 폴백이 있으면 사용
  if (fallback) {
    return <>{fallback}</>;
  }

  // 접근 거부 - 기본 UnauthorizedOverlay 사용
  return <UnauthorizedOverlay message={deniedMessage || message} />;
}
