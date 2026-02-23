'use client';

import { HospitalStaffDetailPanel } from '@/components/settings/HospitalStaffDetailPanel';

export default function HospitalStaffDetailPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">직원 상세</h1>
          <p className="text-sm text-muted-foreground">
            직원 정보를 수정하고 계정 상태를 변경합니다.
          </p>
        </div>
      </header>

      <HospitalStaffDetailPanel />
    </>
  );
}
