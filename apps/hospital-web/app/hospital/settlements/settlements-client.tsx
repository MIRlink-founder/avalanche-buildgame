'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@mire/ui/components/badge';
import { Button } from '@mire/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import { Input } from '@mire/ui/components/input';
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

type PaymentRow = {
  id: number;
  medicalRecordId: number | null;
  hospitalId: string;
  settlementId: number | null;
  subMid: string | null;
  approveNo: string | null;
  pgTransactionId: string | null;
  amount: string;
  paymentMethod: string | null;
  status: string;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

type SettlementRow = {
  id: number;
  hospitalId: string;
  settlementPeriodStart: string;
  settlementPeriodEnd: string;
  totalVolume: string;
  appliedRate: string;
  paybackAmount: string;
  isNftBoosted: boolean;
  status: 'PENDING_PAYMENT' | 'SETTLED' | string;
  settledAt: string | null;
  createdAt: string;
};

type PaymentsResponse = {
  data: PaymentRow[];
  nextCursor: number | null;
};

type SettlementsResponse = {
  data: SettlementRow[];
  nextCursor: number | null;
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  READY: '결제 준비',
  PAID: '결제 완료',
  SETTLED: '정산 완료',
  CANCELLED: '결제 취소',
};

const SETTLEMENT_STATUS_LABELS: Record<SettlementRow['status'], string> = {
  PENDING_PAYMENT: '정산 대기',
  SETTLED: '정산 완료',
};

const MOCK_PAYMENTS: PaymentRow[] = [
  {
    id: 3107,
    medicalRecordId: 9001,
    hospitalId: 'HOS-2026-001',
    settlementId: 101,
    subMid: 'MID-AX01',
    approveNo: 'A55120',
    pgTransactionId: 'TX-20260302-017',
    amount: '420000',
    paymentMethod: 'CARD',
    status: 'PAID',
    paidAt: '2026-03-02T10:12:00.000Z',
    cancelledAt: null,
    createdAt: '2026-03-02T10:12:00.000Z',
  },
  {
    id: 3106,
    medicalRecordId: 8992,
    hospitalId: 'HOS-2026-001',
    settlementId: 101,
    subMid: 'MID-AX01',
    approveNo: 'A55105',
    pgTransactionId: 'TX-20260301-010',
    amount: '880000',
    paymentMethod: 'TRANSFER',
    status: 'PAID',
    paidAt: '2026-03-01T14:25:00.000Z',
    cancelledAt: null,
    createdAt: '2026-03-01T14:25:00.000Z',
  },
  {
    id: 3104,
    medicalRecordId: 8978,
    hospitalId: 'HOS-2026-001',
    settlementId: null,
    subMid: 'MID-AX01',
    approveNo: 'A55044',
    pgTransactionId: 'TX-20260226-004',
    amount: '320000',
    paymentMethod: 'CARD',
    status: 'CANCELLED',
    paidAt: '2026-02-26T09:20:00.000Z',
    cancelledAt: '2026-02-26T11:10:00.000Z',
    createdAt: '2026-02-26T09:20:00.000Z',
  },
];

const MOCK_SETTLEMENTS: SettlementRow[] = [
  {
    id: 101,
    hospitalId: 'HOS-2026-001',
    settlementPeriodStart: '2026-02-01',
    settlementPeriodEnd: '2026-02-28',
    totalVolume: '12500000',
    appliedRate: '92.50',
    paybackAmount: '11562500',
    isNftBoosted: true,
    status: 'PENDING_PAYMENT',
    settledAt: null,
    createdAt: '2026-03-01T09:00:00.000Z',
  },
  {
    id: 99,
    hospitalId: 'HOS-2026-001',
    settlementPeriodStart: '2026-01-01',
    settlementPeriodEnd: '2026-01-31',
    totalVolume: '9800000',
    appliedRate: '90.00',
    paybackAmount: '8820000',
    isNftBoosted: false,
    status: 'SETTLED',
    settledAt: '2026-02-05T10:30:00.000Z',
    createdAt: '2026-02-01T08:10:00.000Z',
  },
];

export function SettlementsClient() {
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paidFrom, setPaidFrom] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [payments, setPayments] = useState<PaymentRow[]>(MOCK_PAYMENTS);
  const [paymentNextCursor, setPaymentNextCursor] = useState<number | null>(
    null,
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const [settlementStatus, setSettlementStatus] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [settlements, setSettlements] =
    useState<SettlementRow[]>(MOCK_SETTLEMENTS);
  const [settlementNextCursor, setSettlementNextCursor] = useState<
    number | null
  >(null);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [isSettlementLoading, setIsSettlementLoading] = useState(false);

  const paymentTotals = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        const amount = parseNumber(payment.amount);
        if (payment.status === 'PAID' || payment.status === 'SETTLED') {
          if (Number.isFinite(amount)) {
            acc.totalRevenue += amount;
          }
          acc.paidCount += 1;
        }
        if (payment.status === 'CANCELLED') {
          acc.cancelledCount += 1;
        }
        return acc;
      },
      { totalRevenue: 0, paidCount: 0, cancelledCount: 0 },
    );
  }, [payments]);

  const settlementTotals = useMemo(() => {
    return settlements.reduce(
      (acc, settlement) => {
        const amount = parseNumber(settlement.paybackAmount);
        if (settlement.status === 'PENDING_PAYMENT') {
          if (Number.isFinite(amount)) {
            acc.pendingAmount += amount;
          }
          acc.pendingCount += 1;
        }
        if (settlement.status === 'SETTLED') {
          if (Number.isFinite(amount)) {
            acc.settledAmount += amount;
          }
          acc.settledCount += 1;
        }
        return acc;
      },
      { pendingAmount: 0, settledAmount: 0, pendingCount: 0, settledCount: 0 },
    );
  }, [settlements]);

  const summaryCards = useMemo(
    () => [
      {
        label: '총 매출',
        value: `${formatAmount(String(paymentTotals.totalRevenue))}원`,
        helper: `결제 ${paymentTotals.paidCount}건`,
      },
      {
        label: '정산 대기',
        value: `${formatAmount(String(settlementTotals.pendingAmount))}원`,
        helper: `${settlementTotals.pendingCount}건`,
      },
      {
        label: '정산 완료',
        value: `${formatAmount(String(settlementTotals.settledAmount))}원`,
        helper: `${settlementTotals.settledCount}건`,
      },
      {
        label: '결제 취소',
        value: `${paymentTotals.cancelledCount}건`,
        helper: '최근 결제 기준',
      },
    ],
    [paymentTotals, settlementTotals],
  );

  const fetchPayments = useCallback(
    async (cursor: number | null) => {
      setIsPaymentLoading(true);
      setPaymentError(null);

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setPaymentError('로그인이 필요합니다');
          return;
        }

        const params = new URLSearchParams();
        if (paymentStatus) {
          params.set('status', paymentStatus);
        }
        if (paidFrom) {
          params.set('paidFrom', paidFrom);
        }
        if (paidTo) {
          params.set('paidTo', paidTo);
        }
        if (cursor) {
          params.set('cursor', String(cursor));
        }
        params.set('limit', '10');

        const response = await fetch(`/api/payments?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response
          .json()
          .catch(() => ({}))) as Partial<PaymentsResponse> & {
          error?: string;
        };

        if (!response.ok) {
          setPaymentError(payload.error || '결제 내역 조회에 실패했습니다');
          return;
        }

        const newItems = payload.data ?? [];
        setPayments((prev) => (cursor ? [...prev, ...newItems] : newItems));
        setPaymentNextCursor(payload.nextCursor ?? null);
      } catch (fetchError) {
        setPaymentError('결제 내역 조회 중 오류가 발생했습니다');
        console.error(fetchError);
      } finally {
        setIsPaymentLoading(false);
      }
    },
    [paidFrom, paidTo, paymentStatus],
  );

  const fetchSettlements = useCallback(
    async (cursor: number | null) => {
      setIsSettlementLoading(true);
      setSettlementError(null);

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setSettlementError('로그인이 필요합니다');
          return;
        }

        const params = new URLSearchParams();
        if (settlementStatus) {
          params.set('status', settlementStatus);
        }
        if (periodFrom) {
          params.set('periodFrom', periodFrom);
        }
        if (periodTo) {
          params.set('periodTo', periodTo);
        }
        if (cursor) {
          params.set('cursor', String(cursor));
        }
        params.set('limit', '10');

        const response = await fetch(`/api/settlements?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response
          .json()
          .catch(() => ({}))) as Partial<SettlementsResponse> & {
          error?: string;
        };

        if (!response.ok) {
          setSettlementError(payload.error || '정산 내역 조회에 실패했습니다');
          return;
        }

        const newItems = payload.data ?? [];
        setSettlements((prev) => (cursor ? [...prev, ...newItems] : newItems));
        setSettlementNextCursor(payload.nextCursor ?? null);
      } catch (fetchError) {
        setSettlementError('정산 내역 조회 중 오류가 발생했습니다');
        console.error(fetchError);
      } finally {
        setIsSettlementLoading(false);
      }
    },
    [periodFrom, periodTo, settlementStatus],
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchPayments(null);
      fetchSettlements(null);
    }
  }, [fetchPayments, fetchSettlements]);

  const handlePaymentSearch = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPaymentError('로그인이 필요합니다');
      return;
    }
    fetchPayments(null);
  };

  const handleSettlementSearch = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setSettlementError('로그인이 필요합니다');
      return;
    }
    fetchSettlements(null);
  };

  return (
    <div className="space-y-5">
      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <CardTitle className="text-base">정산 요약</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            결제 및 정산 현황을 요약합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((item) => (
            <Card key={item.label} className="border-border shadow-none">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs font-semibold">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.helper}
                </p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">결제 내역</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                결제 상태와 기간을 기준으로 확인합니다.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handlePaymentSearch}
              disabled={isPaymentLoading}
            >
              조회하기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                결제 상태
              </Label>
              <Select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                className="bg-background text-sm"
              >
                <option value="">전체</option>
                <option value="READY">결제 준비</option>
                <option value="PAID">결제 완료</option>
                <option value="SETTLED">정산 완료</option>
                <option value="CANCELLED">결제 취소</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                결제 시작일
              </Label>
              <Input
                type="date"
                value={paidFrom}
                onChange={(event) => setPaidFrom(event.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                결제 종료일
              </Label>
              <Input
                type="date"
                value={paidTo}
                onChange={(event) => setPaidTo(event.target.value)}
                className="h-10"
              />
            </div>
          </div>
          {paymentError && (
            <div className="text-destructive text-sm">{paymentError}</div>
          )}
        </CardContent>
        <CardContent className="p-0">
          <Table className="min-w-[860px]">
            <TableHeader className="bg-secondary">
              <TableRow>
                <TableHead className="text-muted-foreground">결제일</TableHead>
                <TableHead className="text-muted-foreground">
                  결제 수단
                </TableHead>
                <TableHead className="text-muted-foreground">
                  승인번호
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  금액
                </TableHead>
                <TableHead className="text-muted-foreground">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    결제 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="border-border">
                    <TableCell>
                      {payment.paidAt
                        ? formatDate(payment.paidAt)
                        : formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>{payment.paymentMethod ?? '-'}</TableCell>
                    <TableCell>{payment.approveNo ?? '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(payment.amount)}원
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary-subtle text-primary text-[10px] font-semibold">
                        {PAYMENT_STATUS_LABELS[payment.status] ??
                          payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-border flex items-center justify-between border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {isPaymentLoading ? '결제 내역을 불러오는 중입니다' : ''}
          </p>
          {paymentNextCursor && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchPayments(paymentNextCursor)}
              className="border-border text-foreground hover:bg-secondary"
              disabled={isPaymentLoading}
            >
              더 보기
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">정산 내역</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                정산 기간과 상태를 기준으로 확인합니다.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handleSettlementSearch}
              disabled={isSettlementLoading}
            >
              조회하기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                정산 상태
              </Label>
              <Select
                value={settlementStatus}
                onChange={(event) => setSettlementStatus(event.target.value)}
                className="bg-background text-sm"
              >
                <option value="">전체</option>
                <option value="PENDING_PAYMENT">정산 대기</option>
                <option value="SETTLED">정산 완료</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                정산 시작일
              </Label>
              <Input
                type="date"
                value={periodFrom}
                onChange={(event) => setPeriodFrom(event.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                정산 종료일
              </Label>
              <Input
                type="date"
                value={periodTo}
                onChange={(event) => setPeriodTo(event.target.value)}
                className="h-10"
              />
            </div>
          </div>
          {settlementError && (
            <div className="text-destructive text-sm">{settlementError}</div>
          )}
        </CardContent>
        <CardContent className="p-0">
          <Table className="min-w-[860px]">
            <TableHeader className="bg-secondary">
              <TableRow>
                <TableHead className="text-muted-foreground">
                  정산 기간
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  정산금
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  정산율
                </TableHead>
                <TableHead className="text-muted-foreground">상태</TableHead>
                <TableHead className="text-muted-foreground">정산일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    정산 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((settlement) => (
                  <TableRow key={settlement.id} className="border-border">
                    <TableCell>
                      {formatPeriod(
                        settlement.settlementPeriodStart,
                        settlement.settlementPeriodEnd,
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(settlement.paybackAmount)}원
                    </TableCell>
                    <TableCell className="text-right">
                      {formatRate(settlement.appliedRate)}%
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary-subtle text-primary text-[10px] font-semibold">
                        {SETTLEMENT_STATUS_LABELS[settlement.status] ??
                          settlement.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {settlement.settledAt
                        ? formatDate(settlement.settledAt)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-border flex items-center justify-between border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {isSettlementLoading ? '정산 내역을 불러오는 중입니다' : ''}
          </p>
          {settlementNextCursor && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchSettlements(settlementNextCursor)}
              className="border-border text-foreground hover:bg-secondary"
              disabled={isSettlementLoading}
            >
              더 보기
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function parseNumber(value: string) {
  if (!value) {
    return Number.NaN;
  }
  const normalized = value.replace(/,/g, '').trim();
  return Number(normalized);
}

function formatAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }
  return new Intl.NumberFormat('ko-KR').format(amount);
}

function formatRate(value: string) {
  const rate = Number(value);
  if (!Number.isFinite(rate)) {
    return value;
  }
  return rate.toFixed(2);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('ko-KR');
}

function formatPeriod(start: string, end: string) {
  if (!start || !end) {
    return '-';
  }
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}
