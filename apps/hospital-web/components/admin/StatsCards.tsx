import { TrendingUp, CheckCircle, Building2, AlertCircle } from 'lucide-react';

interface StatsCardsProps {
  pendingCount: number;
  activeCount: number;
  newThisMonthCount: number;
}

export function StatsCards({
  pendingCount,
  activeCount,
  newThisMonthCount,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 가입 승인 대기 */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">가입 승인 대기</p>
            <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
          </div>
          <div className="rounded-full bg-orange-100 p-3">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* 정상 운영 중 */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">정상 운영 중</p>
            <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* 이번 달 신규 가입 */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">이번 달 신규 가입</p>
            <p className="mt-2 text-3xl font-semibold">{newThisMonthCount}</p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
