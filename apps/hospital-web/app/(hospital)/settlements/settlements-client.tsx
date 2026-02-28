'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@mire/ui/components/card';
import { Badge } from '@mire/ui/components/badge';
import { Select } from '@mire/ui/components/select';
import { Button } from '@mire/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mire/ui/components/table';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { Landmark, Info } from 'lucide-react';
import { Pagination } from '@/components/layout/Pagination';

interface SettlementRow {
  id: number;
  publicId: string;
  settlementPeriodStart: string;
  settlementPeriodEnd: string;
  totalVolume: string;
  caseCount: number;
  appliedRate: string;
  paybackAmount: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'SETTLED' | string;
  settledAt: string | null;
  createdAt: string;
}

interface SettlementSummary {
  totalPayback: number;
  totalCaseCount: number;
}

interface AccountInfo {
  accountBank: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
}

interface CurrentMonth {
  paybackAmount: number;
  caseCount: number;
  periodStart: string;
  periodEnd: string;
}

interface SettlementsApiResponse {
  data: SettlementRow[];
  total: number;
  page: number;
  limit: number;
  summary: SettlementSummary;
  paybackRate: number;
  paybackRateUpdatedAt: string;
  account: AccountInfo;
  currentMonth: CurrentMonth | null;
  nextPaymentDate?: { dateString: string; dDay: number };
  paymentDayOfMonth?: number;
}

const ITEMS_PER_PAGE = 5;

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  CONFIRMED: '확인',
  PAID: '완료',
  SETTLED: '완료',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning text-white hover:bg-warning',
  CONFIRMED: 'bg-primary text-white hover:bg-primary',
  PAID: 'bg-primary text-white hover:bg-primary',
  SETTLED: 'bg-primary text-white hover:bg-primary',
};

const SETTLEMENT_POLICIES_BASE = [
  '지급일이 주말/공휴일인 경우 익영업일에 지급됩니다.',
  '계좌 정보 변경은 설정에서 변경 해주세요.',
  '정산 내역은 최대 24개월까지 조회 가능합니다.',
];

/* ───────────── 유틸리티 함수 ───────────── */

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('ko-KR').format(value);
}

/** 계좌번호 마스킹: 중간 세그먼트를 **** 처리 */
function maskAccountNumber(accountNumber: string): string {
  const parts = accountNumber.split('-');
  if (parts.length <= 2) {
    if (accountNumber.length <= 7) return accountNumber;
    return accountNumber.slice(0, 3) + '****' + accountNumber.slice(-4);
  }
  return parts
    .map((seg, idx) => {
      if (idx === 0 || idx === parts.length - 1) return seg;
      return '****';
    })
    .join('-');
}

/** settlementPeriodStart → "YYYY년 M월" 형식 */
function formatPeriodMonth(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/** 집계 기간 라벨: "MM.DD ~ MM.DD (진행 중)" */
function formatCollectionPeriod(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(s)} ~ ${fmt(e)} (진행 중)`;
}

/** settledAt → "YYYY.MM.DD" 또는 "-" */
function formatSettledDate(settledAt: string | null): string {
  if (!settledAt) return '-';
  const d = new Date(settledAt);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** 연도 선택 옵션 생성 (현재 연도 ~ 2025) */
function buildYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2025; y--) {
    years.push(y);
  }
  return years;
}

export function SettlementsClient() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [account, setAccount] = useState<AccountInfo>({
    accountBank: null,
    accountNumber: null,
    accountHolder: null,
  });
  const [currentMonth, setCurrentMonth] = useState<CurrentMonth | null>(null);
  const [nextPaymentDate, setNextPaymentDate] = useState<{
    dateString: string;
    dDay: number;
  } | null>(null);
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState<number>(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = buildYearOptions();

  const fetchSettlements = useCallback(
    async (year: number, pageNum: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/settlements/my?year=${year}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`,
          { headers: getAuthHeaders() },
        );
        if (redirectIfUnauthorized(res)) return;
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const msg =
            (payload as Record<string, unknown>).error ??
            '정산 내역을 불러오지 못했습니다.';
          setError(String(msg));
          return;
        }
        const payload: SettlementsApiResponse = await res.json();
        setSettlements(payload.data ?? []);
        setTotal(payload.total ?? 0);
        setPage(payload.page ?? pageNum);
        setAccount(
          payload.account ?? {
            accountBank: null,
            accountNumber: null,
            accountHolder: null,
          },
        );
        setCurrentMonth(payload.currentMonth ?? null);
        setNextPaymentDate(payload.nextPaymentDate ?? null);
        setPaymentDayOfMonth(payload.paymentDayOfMonth ?? 25);
      } catch {
        setError('정산 내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchSettlements(selectedYear, 1);
    setPage(1);
  }, [selectedYear, fetchSettlements]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(Number(e.target.value));
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchSettlements(selectedYear, newPage);
  };

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const nextPayDate = nextPaymentDate?.dateString ?? '-';
  const dDay = nextPaymentDate?.dDay ?? 0;

  const settlementPolicies = [
    `매월 1일~말일까지 집계된 리워드는 익월 ${paymentDayOfMonth}일에 자동 이체됩니다.`,
    ...SETTLEMENT_POLICIES_BASE,
  ];

  const currentMonthLabel = currentMonth
    ? formatCollectionPeriod(currentMonth.periodStart, currentMonth.periodEnd)
    : null;

  return (
    <div className="space-y-6">
      {/* 상단 카드 3개 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. 다음 지급 예정일 */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <p className="text-muted-foreground">다음 지급 예정일</p>
            <p className="text-xl font-semibold">
              {loading ? '-' : nextPayDate}
            </p>
            <span className="inline-block rounded-full bg-gray-100 px-3 py-0.5 text-xs text-gray-500">
              D-{dDay}
            </span>
          </CardContent>
        </Card>

        {/* 2. 이번 달 지급 예정 금액 */}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">이번 달 지급 예정 금액</p>
            <p className="mt-3">
              {loading ? (
                <span className="text-3xl font-bold">-</span>
              ) : currentMonth ? (
                <>
                  <span className="text-4xl font-semibold font-mono">
                    {formatAmount(currentMonth.paybackAmount)}
                  </span>
                  <span className="ml-0.5 text-lg">원</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold">0</span>
                  <span className="ml-0.5 text-lg font-medium">원</span>
                </>
              )}
            </p>
            {currentMonthLabel && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                집계 기간: {currentMonthLabel}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 3. 계좌 정보 */}
        <Card className="bg-muted/50">
          <CardContent className="p-6 space-y-2">
            {loading ? (
              <p className="text-sm text-foreground">-</p>
            ) : account.accountBank && account.accountNumber ? (
              <>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Landmark className="h-4 w-4" />
                  {account.accountBank}
                </div>
                <p className="mt-2 text-lg font-medium">
                  {maskAccountNumber(account.accountNumber)}
                </p>
                {account.accountHolder && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    예금주: {account.accountHolder}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Landmark className="h-4 w-4" />
                  계좌 정보
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  등록된 계좌 정보가 없습니다.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 테이블 */}
      <Card className="border-border">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h2 className="text-lg font-semibold">월별 정산 내역</h2>
          <Select
            value={String(selectedYear)}
            onChange={handleYearChange}
            className="w-[100px] pr-6"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>

        <div className="p-0">
          <Table className="w-full text-sm table-fixed">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>기간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>진료 등록</TableHead>
                <TableHead>총 지급액</TableHead>
                <TableHead>지급일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : settlements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    정산 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-4 text-center whitespace-nowrap">
                      {formatPeriodMonth(item.settlementPeriodStart)}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        className={
                          STATUS_COLORS[item.status] ??
                          'bg-gray-100 text-gray-700 hover:bg-gray-100'
                        }
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      {formatAmount(item.caseCount)}건
                    </TableCell>
                    <TableCell className="py-4 text-right whitespace-nowrap font-semibold">
                      {formatAmount(Number(item.paybackAmount))} 원
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap text-muted-foreground">
                      {formatSettledDate(item.settledAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 */}
        <div className="border-t border-border px-6 py-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={total}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      </Card>

      {/* 정산 정책 Footer */}
      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4 text-muted-foreground" />
          정산 정책
        </div>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {settlementPolicies.map((policy, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="shrink-0">{'•'}</span>
              <span>{policy}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
