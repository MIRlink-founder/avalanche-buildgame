'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
} from '@mire/ui/components/card';
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
import { Landmark, Info, ChevronLeft, ChevronRight } from 'lucide-react';

/* ───────────── 타입 정의 ───────────── */

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
}

/* ───────────── 상수 ───────────── */

const ITEMS_PER_PAGE = 5;

const STATUS_LABELS: Record<string, string> = {
  PENDING: '집계 중',
  CONFIRMED: '확인',
  PAID: '완료',
  SETTLED: '완료',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  CONFIRMED: 'bg-blue-600 text-white hover:bg-blue-600',
  PAID: 'bg-blue-600 text-white hover:bg-blue-600',
  SETTLED: 'bg-blue-600 text-white hover:bg-blue-600',
};

const SETTLEMENT_POLICIES = [
  '매월 1일~말일까지 집계된 리워드는 익월 25일에 자동 이체됩니다.',
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

/** 다음 지급 예정일 계산 (매월 25일 기준) */
function calculateNextPaymentDate(): { dateString: string; dDay: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let nextPayment = new Date(year, month, 25);
  if (now.getTime() > nextPayment.getTime()) {
    nextPayment = new Date(year, month + 1, 25);
  }

  const diffMs = nextPayment.getTime() - now.getTime();
  const dDay = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dateString = `${nextPayment.getMonth() + 1}월 ${nextPayment.getDate()}일`;

  return { dateString, dDay };
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

/* ───────────── 페이지네이션 컴포넌트 ───────────── */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || disabled}
        className="h-8 px-2 text-xs"
      >
        <ChevronLeft className="mr-0.5 h-3.5 w-3.5" />
        이전
      </Button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Button
            key={p}
            type="button"
            variant={p === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p)}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              p === currentPage
                ? 'bg-gray-900 text-white hover:bg-gray-800 hover:text-white'
                : ''
            }`}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || disabled}
        className="h-8 px-2 text-xs"
      >
        다음
        <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/* ───────────── 메인 컴포넌트 ───────────── */

export function SettlementsClient() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [account, setAccount] = useState<AccountInfo>({ accountBank: null, accountNumber: null, accountHolder: null });
  const [currentMonth, setCurrentMonth] = useState<CurrentMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = buildYearOptions();

  const fetchSettlements = useCallback(async (year: number, pageNum: number) => {
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
      setAccount(payload.account ?? { accountBank: null, accountNumber: null, accountHolder: null });
      setCurrentMonth(payload.currentMonth ?? null);
    } catch {
      setError('정산 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

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
  const { dateString: nextPayDate, dDay } = calculateNextPaymentDate();

  const currentMonthLabel = currentMonth
    ? formatCollectionPeriod(currentMonth.periodStart, currentMonth.periodEnd)
    : null;

  return (
    <section className="space-y-5 p-6">
      {/* 상단 카드 3개 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. 다음 지급 예정일 */}
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">다음 지급 예정일</p>
            <p className="mt-2 text-xl font-semibold">{nextPayDate}</p>
            <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-3 py-0.5 text-xs text-gray-500">
              D-{dDay}
            </span>
          </CardContent>
        </Card>

        {/* 2. 이번 달 지급 예정 금액 */}
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">이번 달 지급 예정 금액</p>
            <p className="mt-3">
              {loading ? (
                <span className="text-3xl font-bold">-</span>
              ) : currentMonth ? (
                <>
                  <span className="text-3xl font-bold">{formatAmount(currentMonth.paybackAmount)}</span>
                  <span className="ml-0.5 text-lg font-medium">원</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold">0</span>
                  <span className="ml-0.5 text-lg font-medium">원</span>
                </>
              )}
            </p>
            {currentMonthLabel && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                집계 기간: {currentMonthLabel}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 3. 계좌 정보 */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">-</p>
            ) : account.accountBank && account.accountNumber ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Landmark className="h-4 w-4" />
                  {account.accountBank}
                </div>
                <p className="mt-2 text-base font-medium">
                  {maskAccountNumber(account.accountNumber)}
                </p>
                {account.accountHolder && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
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
          <h2 className="text-base font-semibold">월별 정산 내역</h2>
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
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[18%]" />
            </colgroup>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center">기간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>진료 등록</TableHead>
                <TableHead className="text-right">총 지급액</TableHead>
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
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-center border-t border-border px-6 py-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          </div>
        )}
      </Card>

      {/* 정산 정책 Footer */}
      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4 text-muted-foreground" />
          정산 정책
        </div>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {SETTLEMENT_POLICIES.map((policy, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="shrink-0">{'•'}</span>
              <span>{policy}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
