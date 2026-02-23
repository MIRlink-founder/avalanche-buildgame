'use client';

import { HospitalStaffPanel } from '@/components/settings/HospitalStaffPanel';

export default function HospitalStaffPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">직원 관리</h1>
          <p className="text-sm text-muted-foreground">
            병원 직원 계정을 초대하고 상태를 관리합니다.
          </p>
        </div>
      </header>

      <HospitalStaffPanel />
    </>
  );
}
