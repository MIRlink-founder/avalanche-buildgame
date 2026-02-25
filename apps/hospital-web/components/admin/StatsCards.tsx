import { TrendingUp, CheckCircle, AlertCircle, Hospital } from 'lucide-react';

type StatsCardsProps =
  | {
      variant: 'pending';
      pendingCount: number;
      activeCount: number;
      newThisMonthCount: number;
    }
  | {
      variant: 'overview';
      totalCount: number;
      newThisMonthCount: number;
      withdrawnCount: number;
    };

export function StatsCards(props: StatsCardsProps) {
  if (props.variant === 'pending') {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {/* 가입 승인 대기 */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">가입 승인 대기</p>
              <p className="mt-2 text-3xl font-semibold">
                {props.pendingCount} 건
              </p>
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
              <p className="mt-2 text-3xl font-semibold">
                {props.activeCount} 개
              </p>
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
              <p className="mt-2 text-3xl font-semibold">
                {props.newThisMonthCount} 개
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 전체 병원 */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">전체 병원</p>
            <p className="mt-2 text-3xl font-semibold">{props.totalCount} 개</p>
          </div>
          <div className="rounded-full bg-gray-100 p-3">
            <Hospital className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* 이번 달 신규 가입 */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">이번 달 신규 가입</p>
            <p className="mt-2 text-3xl font-semibold">
              {props.newThisMonthCount} 개
            </p>
          </div>
          <div className="rounded-full bg-gray-100 p-3">
            <TrendingUp className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* 탈퇴 병원 */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">탈퇴 병원</p>
            <p className="mt-2 text-3xl font-semibold">
              {props.withdrawnCount} 개
            </p>
          </div>
          <div className="rounded-full bg-gray-100 p-3">
            <CheckCircle className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
