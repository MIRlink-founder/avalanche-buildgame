'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import { Badge } from '@mire/ui/components/badge';
import { Select } from '@mire/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mire/ui/components/table';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';

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
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | string;
  settledAt: string | null;
  createdAt: string;
}

interface SettlementSummary {
  totalPayback: number;
  totalCaseCount: number;
}

interface SettlementsApiResponse {
  data: SettlementRow[];
  summary: SettlementSummary;
  paybackRate: number;
  paybackRateUpdatedAt: string;
}

/* ───────────── 상수 ───────────── */

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  CONFIRMED: '확인',
  PAID: '지급완료',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  CONFIRMED: 'bg-blue-600 text-white hover:bg-blue-600',
  PAID: 'bg-green-600 text-white hover:bg-green-600',
};

/* ───────────── 유틸리티 함수 ───────────── */

/** 숫자를 한국어 천단위 구분 포맷으로 변환 */
function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('ko-KR').format(value);
}

/** settlementPeriodStart → "YYYY년 MM월" 형식으로 변환 */
function formatSettlementMonth(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}년 ${month}월`;
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

/* ───────────── 메인 컴포넌트 ───────────── */

export function SettlementsClient() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [summary, setSummary] = useState<SettlementSummary>({
    totalPayback: 0,
    totalCaseCount: 0,
  });
  const [paybackRate, setPaybackRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = buildYearOptions();

  /** 정산 데이터 조회 */
  const fetchSettlements = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settlements/my?year=${year}`, {
        headers: getAuthHeaders(),
      });
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
      setSummary(
        payload.summary ?? { totalPayback: 0, totalCaseCount: 0 },
      );
      setPaybackRate(payload.paybackRate ?? 0);
    } catch {
      setError('정산 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements(selectedYear);
  }, [selectedYear, fetchSettlements]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(Number(e.target.value));
  };

  return (
    <section className="space-y-6 p-6">
      {/* 1. 페이백 비율 카드 (읽기전용) */}
      <Card className="border-border">
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-sm font-medium text-muted-foreground">
            현재 적용 리워드 비율
          </p>
          <p className="text-2xl font-semibold">
            {loading ? '-' : `${paybackRate}%`}
          </p>
        </CardContent>
      </Card>

      {/* 2. 요약 카드 2개 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              총 리워드 금액
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {loading ? '-' : `${formatAmount(summary.totalPayback)}원`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              총 등록 건 수
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {loading ? '-' : `${formatAmount(summary.totalCaseCount)}건`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. 월별 리워드 지급 내역 테이블 */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle className="text-base">월별 리워드 지급 내역</CardTitle>
          <Select
            value={String(selectedYear)}
            onChange={handleYearChange}
            className="w-[120px]"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[760px] text-sm">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[140px]">지급 월</TableHead>
                <TableHead className="text-right">등록 건 수</TableHead>
                <TableHead className="text-right">적용 비율(%)</TableHead>
                <TableHead className="text-right">산정 금액</TableHead>
                <TableHead className="text-right">실지급액</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-8 text-center text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : settlements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    정산 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {formatSettlementMonth(item.settlementPeriodStart)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                      {formatAmount(item.caseCount)}건
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                      {item.appliedRate}%
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                      {formatAmount(Number(item.totalVolume))}원
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                      {formatAmount(Number(item.paybackAmount))}원
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={
                          STATUS_COLORS[item.status] ??
                          'bg-gray-100 text-gray-700 hover:bg-gray-100'
                        }
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
