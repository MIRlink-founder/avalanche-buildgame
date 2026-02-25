import { PaymentsClient } from './payments-client';

export default function PaymentsPage() {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">결제 내역</h1>
          <p className="text-sm text-muted-foreground">
            결제 상태, 금액, 결제수단 등을 확인합니다.
          </p>
        </div>
      </header>

      <PaymentsClient />
    </>
  );
}
