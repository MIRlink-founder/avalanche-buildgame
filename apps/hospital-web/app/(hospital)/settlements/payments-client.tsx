'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@mire/ui/components/card';
import { Badge } from '@mire/ui/components/badge';
import { Select } from '@mire/ui/components/select';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mire/ui/components/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@mire/ui/components/sheet';
import { ScrollArea } from '@mire/ui/components/scroll-area';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { Pagination } from '@/components/layout/Pagination';
import { RotateCcw, Ban } from 'lucide-react';

/* ───────────── 타입 정의 ───────────── */

interface PaymentRow {
  id: number;
  medicalRecordId: number;
  hospitalId: string;
  subMid: string;
  approveNo: string | null;
  pgTransactionId: string | null;
  amount: string;
  paymentMethod: string | null;
  status: string;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  settlementId: number | null;
}

interface PageApiResponse {
  data: PaymentRow[];
  total: number;
  page: number;
  limit: number;
}

/* ───────────── 상수 ───────────── */

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'READY', label: '대기' },
  { value: 'PAID', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
];

const STATUS_LABELS: Record<string, string> = {
  READY: '대기',
  PAID: '완료',
  SETTLED: '완료',
  CANCELLED: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  READY: 'bg-warning text-white hover:bg-warning',
  PAID: 'bg-primary text-white hover:bg-primary',
  SETTLED: 'bg-primary text-white hover:bg-primary',
  CANCELLED: 'bg-destructive text-white hover:bg-destructive',
};

const METHOD_LABELS: Record<string, string> = {
  CARD: '카드',
  CASH: '현금',
  MIXED: '혼합',
};

/* ───────────── 유틸리티 함수 ───────────── */

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '-';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function getMethodLabel(method: string | null): string {
  if (!method) return '-';
  return METHOD_LABELS[method] ?? method;
}

/* ───────────── 결제 취소 섹션 ───────────── */

function CancelSection({
  payment,
  onCancelled,
}: {
  payment: PaymentRow;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!reason.trim()) {
      setCancelError('취소 사유를 입력해주세요.');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          orderId: `PAY-${payment.id}`,
          amount: payment.amount,
          reason: reason.trim(),
          medicalRecordId: payment.medicalRecordId,
          hospitalId: payment.hospitalId,
          providerTransactionId: payment.pgTransactionId ?? '',
          approvalCode: payment.approveNo ?? '',
          subMerchantId: payment.subMid,
          persist: true,
        }),
      });
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setCancelError(
          String(
            (payload as Record<string, unknown>).error ??
              '취소 처리에 실패했습니다.',
          ),
        );
        return;
      }
      onCancelled();
    } catch {
      setCancelError('취소 요청 중 오류가 발생했습니다.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Ban className="h-4 w-4 text-destructive" />
        결제 취소
      </h3>
      <div className="space-y-3">
        <Input
          placeholder="취소 사유를 입력해주세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {cancelError && (
          <p className="text-sm text-destructive">{cancelError}</p>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full"
        >
          {cancelling ? '취소 처리 중...' : '결제 취소'}
        </Button>
      </div>
    </section>
  );
}

/* ───────────── 메인 컴포넌트 ───────────── */

export function PaymentsClient() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [paidFrom, setPaidFrom] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null,
  );

  const fetchPayments = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', String(ITEMS_PER_PAGE));
        if (statusFilter) params.set('status', statusFilter);
        if (paidFrom) params.set('paidFrom', paidFrom);
        if (paidTo) params.set('paidTo', paidTo);

        const res = await fetch(`/api/payments?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        if (redirectIfUnauthorized(res)) return;
        if (!res.ok) {
          const p = await res.json().catch(() => ({}));
          setError(
            String(
              (p as Record<string, unknown>).error ??
                '결제 내역을 불러오지 못했습니다.',
            ),
          );
          return;
        }
        const payload: PageApiResponse = await res.json();
        setPayments(payload.data ?? []);
        setTotal(payload.total ?? 0);
        setPage(payload.page ?? pageNum);
      } catch {
        setError('결제 내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, paidFrom, paidTo],
  );

  useEffect(() => {
    setPage(1);
    fetchPayments(1);
  }, [fetchPayments]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPayments(newPage);
  };

  const handleFilterReset = () => {
    setStatusFilter('');
    setPaidFrom('');
    setPaidTo('');
  };

  const handleCancelled = () => {
    setSelectedPayment(null);
    fetchPayments(page);
  };

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <section className="space-y-5">
      {/* 필터 바 */}
      <Card className="border-border">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[140px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={paidFrom}
            onChange={(e) => setPaidFrom(e.target.value)}
            className="w-[160px]"
          />
          <span className="text-sm text-muted-foreground">~</span>
          <Input
            type="date"
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
            className="w-[160px]"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFilterReset}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </Button>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <Card className="border-border">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h2 className="text-base font-semibold">결제 목록</h2>
        </div>
        <div className="p-0">
          <Table className="w-full text-sm table-fixed">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>결제번호</TableHead>
                <TableHead>진료기록</TableHead>
                <TableHead>결제수단</TableHead>
                <TableHead>결제 금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>결제일시</TableHead>
                <TableHead>등록일시</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    결제 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-4 whitespace-nowrap">
                      #{item.id}
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      #{item.medicalRecordId}
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      {getMethodLabel(item.paymentMethod)}
                    </TableCell>
                    <TableCell className="py-4 text-right whitespace-nowrap font-semibold">
                      {formatAmount(Number(item.amount))}원
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
                    <TableCell className="py-4 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(item.paidAt)}
                    </TableCell>
                    <TableCell className="py-4 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(item)}
                      >
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 */}
        <div className="border-t border-border px-6 py-3">
          {' '}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={total}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      </Card>

      {/* 결제 상세 Sheet */}
      <Sheet
        open={selectedPayment !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPayment(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-none flex-col sm:max-w-[480px]"
        >
          {selectedPayment && (
            <>
              <SheetHeader>
                <SheetTitle>
                  결제 상세 #{selectedPayment.id}
                  <Badge
                    className={`${STATUS_COLORS[selectedPayment.status] ?? 'bg-gray-100 text-gray-700'} ml-2`}
                  >
                    {STATUS_LABELS[selectedPayment.status] ??
                      selectedPayment.status}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <ScrollArea className="min-h-0 flex-1 py-6 pr-4 border-t">
                {/* 기본 정보 */}
                <section className="space-y-3">
                  <h3 className="font-semibold text-foreground">기본 정보</h3>
                  <dl className="grid gap-2 text-sm rounded-lg bg-muted p-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">결제번호</dt>
                      <dd className="font-medium">#{selectedPayment.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">결제 금액</dt>
                      <dd className="font-semibold">
                        {formatAmount(Number(selectedPayment.amount))}원
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">결제수단</dt>
                      <dd className="font-medium">
                        {getMethodLabel(selectedPayment.paymentMethod)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">진료기록</dt>
                      <dd className="font-medium">
                        #{selectedPayment.medicalRecordId}
                      </dd>
                    </div>
                    {selectedPayment.settlementId && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">정산번호</dt>
                        <dd className="font-medium">
                          #{selectedPayment.settlementId}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>

                {/* PG 정보 */}
                <section className="mt-8 space-y-3">
                  <h3 className="font-semibold text-foreground">PG 정보</h3>
                  <dl className="grid gap-2 text-sm rounded-lg bg-muted p-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">승인번호</dt>
                      <dd className="font-mono">
                        {selectedPayment.approveNo ?? '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">PG 거래 ID</dt>
                      <dd className="font-mono break-all text-right max-w-[60%]">
                        {selectedPayment.pgTransactionId ?? '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">가맹점 (SubMID)</dt>
                      <dd className="font-mono">{selectedPayment.subMid}</dd>
                    </div>
                  </dl>
                </section>

                {/* 일시 정보 */}
                <section className="mt-8 space-y-3">
                  <h3 className="font-semibold text-foreground">일시 정보</h3>
                  <dl className="grid gap-2 text-sm rounded-lg bg-muted p-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">결제일시</dt>
                      <dd className="font-medium">
                        {formatDateTime(selectedPayment.paidAt)}
                      </dd>
                    </div>
                    {selectedPayment.cancelledAt && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">취소일시</dt>
                        <dd className="font-medium">
                          {formatDateTime(selectedPayment.cancelledAt)}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">등록일시</dt>
                      <dd className="font-medium">
                        {formatDateTime(selectedPayment.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </section>

                {/* 결제 취소 */}
                {selectedPayment.status === 'PAID' && (
                  <div className="mt-8">
                    <CancelSection
                      payment={selectedPayment}
                      onCancelled={handleCancelled}
                    />
                  </div>
                )}
              </ScrollArea>

              <SheetFooter className="flex gap-2 border-t pt-6">
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => setSelectedPayment(null)}
                >
                  닫기
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
