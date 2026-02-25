'use client';

import { FilterSidebar } from '@/components/reports/FilterSidebar';
import { ReportsContent } from '@/components/reports/ReportsContent';
import { FeatureGate } from '@/components/auth/FeatureGate';
import { FEATURES } from '@/lib/permissions/features';
import { getAuthHeaders } from '@/lib/get-auth-headers';

async function fetchReportsGateStats() {
  const res = await fetch('/api/hospitals/reports-gate', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('통계 조회에 실패했습니다.');
  const data = await res.json();
  return {
    hospitalType: data.hospitalType as string | undefined,
    paidOrOnChainedRecordCount: data.paidOrOnChainedRecordCount as
      | number
      | undefined,
  };
}

export default function ReportsPage() {
  return (
    <FeatureGate
      feature={FEATURES.REPORTS}
      fetchDataStats={fetchReportsGateStats}
    >
      <div className="flex h-[calc(100vh-5rem)] overflow-hidden bg-neutral-50/50">
        {/* Sidebar: Filters */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r bg-background">
          <FilterSidebar />
        </aside>

        {/* Main Content: Reports */}
        <main className="flex-1 overflow-y-auto">
          <ReportsContent />
        </main>
      </div>
    </FeatureGate>
  );
}
