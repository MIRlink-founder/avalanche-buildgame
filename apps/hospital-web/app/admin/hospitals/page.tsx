'use client';

import { HospitalsPageClient } from '@/components/admin/HospitalsPageClient';

export default function HospitalsPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">병원 회원 관리</h1>
          <p className="text-sm text-gray-600">
            등록된 병원을 관리하고 신규 가입을 승인합니다.
          </p>
        </div>
      </header>

      <HospitalsPageClient />
    </>
  );
}
