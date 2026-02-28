'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HospitalDetail } from '@/lib/admin-hospital-types';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Badge } from '@mire/ui/components/badge';
import { Label } from '@mire/ui/components/label';
import { Select } from '@mire/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mire/ui/components/table';
import { Separator } from '@mire/ui';
import { Pagination } from '@/components/layout/Pagination';

// ── 정산 내역 항목 타입 ──
interface SettlementItem {
  id: number;
  publicId: string;
  settlementPeriodStart: string;
  settlementPeriodEnd: string;
  totalVolume: string;
  caseCount: number;
  appliedRate: string;
  paybackAmount: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID';
  settledAt: string | null;
  createdAt: string;
}

// ── 정산 API 응답 타입 ──
interface SettlementResponse {
  data: SettlementItem[];
  summary: {
    totalPayback: number;
    totalCaseCount: number;
  };
  hospital: {
    paybackRate: string | null;
    paybackRateUpdatedAt: string | null;
  };
  paymentDayOfMonth?: number;
  pagination: {
    totalCount: number;
    totalPages: number;
    pageSize: number;
    currentPage: number;
  };
}

// ── 상태 Badge 매핑 ──
const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기',
  CONFIRMED: '확인',
  PAID: '완료',
  SETTLED: '완료',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'border-2 border-warning bg-white text-warning',
  CONFIRMED: 'border-2 border-success bg-white text-success',
  PAID: 'border-2 border-primary bg-white text-primary',
  SETTLED: 'border-2 border-primary bg-white text-primary',
};

// ── 금액 포맷 (원 단위, 천 단위 콤마) ──
function formatAmount(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '-';
  return '₩ ' + num.toLocaleString('ko-KR');
}

// ── 지급 월 포맷: settlementPeriodStart → "YYYY년 MM월" ──
function formatPeriod(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}.${m}`;
}

// ── 연도 선택 옵션 (현재 연도 ~ 2025) ──
function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 2025; y--) {
    years.push(y);
  }
  return years;
}

const PAGE_SIZE = 10;

interface HospitalDetailSettlementProps {
  hospital: HospitalDetail;
  onRefresh: () => void;
}

export function HospitalDetailSettlement({
  hospital,
  onRefresh,
}: HospitalDetailSettlementProps) {
  // ── 페이백 비율 설정 상태 ──
  const [rateInput, setRateInput] = useState(hospital.paybackRate ?? '');
  const [rateSaving, setRateSaving] = useState(false);

  // ── 정산 내역 상태 ──
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [summary, setSummary] = useState<SettlementResponse['summary']>({
    totalPayback: 0,
    totalCaseCount: 0,
  });
  const [pagination, setPagination] = useState<
    SettlementResponse['pagination']
  >({
    totalCount: 0,
    totalPages: 0,
    pageSize: PAGE_SIZE,
    currentPage: 1,
  });
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState(25);
  const [loading, setLoading] = useState(false);

  // ── API에서 돌아온 최신 hospital.paybackRate 상태 ──
  const [currentRate, setCurrentRate] = useState<string | null>(
    hospital.paybackRate,
  );
  const [currentRateUpdatedAt, setCurrentRateUpdatedAt] = useState<
    string | null
  >(hospital.paybackRateUpdatedAt);

  // hospital prop 변경 시 동기화
  useEffect(() => {
    setCurrentRate(hospital.paybackRate);
    setCurrentRateUpdatedAt(hospital.paybackRateUpdatedAt);
  }, [hospital.paybackRate, hospital.paybackRateUpdatedAt]);

  // ── 정산 데이터 조회 ──
  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/hospitals/${hospital.id}/settlements?year=${selectedYear}&page=${page}&pageSize=${PAGE_SIZE}`,
        { headers: getAuthHeaders() },
      );
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || '정산 데이터를 불러오지 못했습니다.');
        return;
      }
      const json: SettlementResponse = await res.json();
      setSettlements(json.data);
      setSummary(json.summary);
      setPagination(json.pagination);
      if (json.paymentDayOfMonth != null) {
        setPaymentDayOfMonth(json.paymentDayOfMonth);
      }
      // API 응답의 병원 정보 동기화
      setCurrentRate(json.hospital.paybackRate);
      setCurrentRateUpdatedAt(json.hospital.paybackRateUpdatedAt);
    } catch {
      alert('정산 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [hospital.id, selectedYear, page]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // ── 페이백 비율 저장 ──
  const handleSaveRate = async () => {
    if (rateSaving) return;

    // 빈 값이면 null(기본값 리셋)으로 전송
    const trimmed = rateInput.trim();
    const payload: { paybackRate: number | null } =
      trimmed === '' ? { paybackRate: null } : { paybackRate: Number(trimmed) };

    if (payload.paybackRate !== null) {
      if (
        Number.isNaN(payload.paybackRate) ||
        payload.paybackRate < 0 ||
        payload.paybackRate > 100
      ) {
        alert('비율은 0~100 사이의 숫자를 입력해 주세요.');
        return;
      }
    }

    setRateSaving(true);
    try {
      const res = await fetch(
        `/api/admin/hospitals/${hospital.id}/payback-rate`,
        {
          method: 'PATCH',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (redirectIfUnauthorized(res)) return;
      if (res.ok) {
        setRateInput('');
        onRefresh();
        // 정산 데이터 다시 불러오기 (비율 반영)
        await fetchSettlements();
      } else {
        const json = await res.json();
        alert(json.error || '페이백 비율 저장에 실패했습니다.');
      }
    } catch {
      alert('페이백 비율 저장 중 오류가 발생했습니다.');
    } finally {
      setRateSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex w-full gap-6">
        {/* ── 1. 페이백 비율 설정 카드 ── */}
        <Card className="w-1/2">
          <CardHeader>
            <CardTitle>페이백 비율 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 비율 입력 */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="payback-rate">리워드 비율 (%)</Label>
                <Input
                  id="payback-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  placeholder={currentRate ?? '0.0'}
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-1/2 mr-2"
                />
                %
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              설정된 비율에 따라 매월 {paymentDayOfMonth}일 리워드가 자동
              산출됩니다.
            </p>

            <Separator />

            {/* 최종 수정일 */}
            <p className="text-xs text-muted-foreground">
              최종 수정:
              {currentRateUpdatedAt
                ? new Date(currentRateUpdatedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ' -'}
            </p>

            <div className="flex justify-end">
              <Button onClick={handleSaveRate} disabled={rateSaving}>
                {rateSaving ? '저장 중...' : '설정 저장'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. 요약 카드 ── */}
        <div className="w-1/2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">총 받은 리워드 금액</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">{formatAmount(summary.totalPayback)}</p>
              <p className="mt-2 text-muted-foreground text-sm">
                누적 지급 완료 금액
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">총 등록 건 수</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">
                {summary.totalCaseCount.toLocaleString('ko-KR')} 건
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                데이터 업로드 및 유효 승인 건
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 3. 월별 리워드 지급 내역 ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>월별 리워드 지급 내역</CardTitle>
          <Select
            value={String(selectedYear)}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setPage(1);
            }}
            className="w-32"
          >
            {getYearOptions().map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          ) : settlements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              해당 연도에 정산 내역이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>지급 월</TableHead>
                  <TableHead>등록 건 수</TableHead>
                  <TableHead>적용 비율</TableHead>
                  <TableHead>산정 금액</TableHead>
                  <TableHead>실지급액</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {formatPeriod(item.settlementPeriodStart)}
                    </TableCell>
                    <TableCell>
                      {item.caseCount.toLocaleString('ko-KR')} 건
                    </TableCell>
                    <TableCell>{item.appliedRate}%</TableCell>
                    <TableCell>{formatAmount(item.totalVolume)}</TableCell>
                    <TableCell>{formatAmount(item.paybackAmount)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLOR[item.status] ?? ''}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-2">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={pagination.pageSize}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
