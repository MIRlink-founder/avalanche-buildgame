'use client';

import { SettlementsClient } from './settlements-client';

export default function SettlementsPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">정산 관리</h1>
          <p className="text-sm text-muted-foreground">
            매출, 결제 내역, 정산금 정보를 확인합니다.
          </p>
        </div>
      </header>

      <SettlementsClient />
    </>
  );
}
