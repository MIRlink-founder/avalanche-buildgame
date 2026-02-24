'use client';

import { FilterSidebar } from '@/components/reports/FilterSidebar';
import { ReportsContent } from '@/components/reports/ReportsContent';
import { FeatureGate } from '@/components/auth/FeatureGate';
import { FEATURES } from '@/lib/permissions/features';

export default function ReportsPage() {
  return (
    <FeatureGate
      feature={FEATURES.REPORTS}
      deniedMessage="리포트 기능은 마스터 관리자만 사용할 수 있습니다."
      // 향후 데이터 통계를 포함하려면:
      // fetchDataStats={async () => {
      //   const res = await fetch('/api/hospital/stats');
      //   return res.json();
      // }}
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
