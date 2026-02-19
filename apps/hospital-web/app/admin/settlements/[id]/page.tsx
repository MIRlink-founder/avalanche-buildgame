import { SettlementDetailClient } from './settlement-detail-client';

type SettlementDetailPageProps = {
  params: {
    id: string;
  };
};

export default function SettlementDetailPage({
  params,
}: SettlementDetailPageProps) {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">정산 상세</h1>
          <p className="text-sm text-gray-600">
            정산 ID #{params.id} 상세 정보와 결제/이체 내역을 확인합니다
          </p>
        </div>
      </header>

      <SettlementDetailClient settlementId={params.id} />
    </>
  );
}
