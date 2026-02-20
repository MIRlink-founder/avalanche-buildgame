import { SettlementDetailClient } from './settlement-detail-client';

interface SettlementDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function SettlementDetailPage({
  params,
}: SettlementDetailPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const settlementId = resolvedParams.id?.trim?.() ?? '';
  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center border-b bg-background px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">정산 관리</h1>
          <p className="text-sm text-muted-foreground">
            병원별 정산 내역을 확인하고 지급 상태를 관리합니다
          </p>
        </div>
      </header>

      <SettlementDetailClient settlementId={settlementId} />
    </>
  );
}
