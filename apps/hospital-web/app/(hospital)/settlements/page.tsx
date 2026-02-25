'use client';

import { FEATURES } from '@/lib/permissions/features';
import { FeatureGate } from '@/components/auth/FeatureGate';
import { SettlementsClient } from './settlements-client';
import { Tabs } from '@/components/layout/Tabs';
import { PaymentsClient } from './payments-client';
import { useSearchParams } from 'next/navigation';

const SETTLEMENTS_TABS = [
  { id: 'settlements', label: '정산 내역' },
  { id: 'payments', label: '결제 내역' },
];

export default function SettlementsPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') ?? 'settlements';
  const activeTopTab = tabFromUrl === 'payments' ? 'payments' : 'settlements';

  return (
    <FeatureGate feature={FEATURES.SETTLEMENTS}>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center bg-background px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">정산 관리</h1>
        </div>
      </header>

      <div className="p-6 lg:px-8">
        <Tabs
          tabs={SETTLEMENTS_TABS}
          basePath="/settlements"
          paramName="tab"
          defaultTab="settlements"
        />

        <div className="mt-6">
          {/* 정산 내역 탭 */}
          {activeTopTab === 'settlements' && <SettlementsClient />}
          {/* 결제 내역 탭 */}
          {activeTopTab === 'payments' && <PaymentsClient />}
        </div>
      </div>
    </FeatureGate>
  );
}
