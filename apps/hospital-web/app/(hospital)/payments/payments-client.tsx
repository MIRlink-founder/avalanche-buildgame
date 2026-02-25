'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
} from '@mire/ui/components/card';
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
  SheetDescription,
} from '@mire/ui/components/sheet';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import {
  RotateCcw,
  ChevronDown,
  CreditCard,
  Clock,
  Building2,
  Ban,
  Webhook,
  Receipt,
} from 'lucide-react';

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

interface PaymentLogRow {
  id: number;
  hospitalId: string | null;
  subMid: string;
  approveNo: string | null;
  amount: string;
  status: string;
  pgTransactionId: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

interface CursorApiResponse<T> {
  data: T[];
  nextCursor: number | null;
}

/* ───────────── 상수 ───────────── */

const ITEMS_PER_PAGE = 20;

type TabKey = 'payments' | 'logs';

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'READY', label: '결제대기' },
  { value: 'PAID', label: '결제완료' },
  { value: 'SETTLED', label: '정산완료' },
  { value: 'CANCELLED', label: '취소' },
];

const LOG_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'READY', label: '대기' },
  { value: 'PAID', label: '결제' },
  { value: 'CANCELLED', label: '취소' },
];

const STATUS_LABELS: Record<string, string> = {
  READY: '결제대기',
  PAID: '결제완료',
  SETTLED: '정산완료',
  CANCELLED: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  READY: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  PAID: 'bg-emerald-600 text-white hover:bg-emerald-600',
  SETTLED: 'bg-blue-600 text-white hover:bg-blue-600',
  CANCELLED: 'bg-red-500 text-white hover:bg-red-500',
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

/* ───────────── 결제 취소 다이얼로그 ───────────── */

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

  const canCancel = payment.status === 'PAID';

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
          String((payload as Record<string, unknown>).error ?? '취소 처리에 실패했습니다.'),
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

  if (!canCancel) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Ban className="h-4 w-4 text-destructive" />
        결제 취소
      </h3>
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
  );
}

/* ───────────── 메인 컴포넌트 ───────────── */

export function PaymentsClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('payments');

  // ── 결제 내역 상태 ──
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payCursor, setPayCursor] = useState<number | null>(null);
  const [payLoading, setPayLoading] = useState(true);
  const [payLoadingMore, setPayLoadingMore] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [paidFrom, setPaidFrom] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);

  // ── Webhook 로그 상태 ──
  const [logs, setLogs] = useState<PaymentLogRow[]>([]);
  const [logCursor, setLogCursor] = useState<number | null>(null);
  const [logLoading, setLogLoading] = useState(true);
  const [logLoadingMore, setLogLoadingMore] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [logFrom, setLogFrom] = useState('');
  const [logTo, setLogTo] = useState('');

  /* ── 결제 내역 fetch ── */

  const buildPayUrl = useCallback((cursor: number | null) => {
    const params = new URLSearchParams();
    params.set('limit', String(ITEMS_PER_PAGE));
    if (statusFilter) params.set('status', statusFilter);
    if (paidFrom) params.set('paidFrom', paidFrom);
    if (paidTo) params.set('paidTo', paidTo);
    if (cursor) params.set('cursor', String(cursor));
    return `/api/payments?${params.toString()}`;
  }, [statusFilter, paidFrom, paidTo]);

  const fetchPayments = useCallback(async (cursor: number | null, append: boolean) => {
    if (append) setPayLoadingMore(true);
    else setPayLoading(true);
    setPayError(null);
    try {
      const res = await fetch(buildPayUrl(cursor), { headers: getAuthHeaders() });
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        setPayError(String((p as Record<string, unknown>).error ?? '결제 내역을 불러오지 못했습니다.'));
        return;
      }
      const payload: CursorApiResponse<PaymentRow> = await res.json();
      if (append) setPayments((prev) => [...prev, ...(payload.data ?? [])]);
      else setPayments(payload.data ?? []);
      setPayCursor(payload.nextCursor ?? null);
    } catch {
      setPayError('결제 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setPayLoading(false);
      setPayLoadingMore(false);
    }
  }, [buildPayUrl]);

  useEffect(() => {
    if (activeTab !== 'payments') return;
    setPayments([]);
    setPayCursor(null);
    fetchPayments(null, false);
  }, [fetchPayments, activeTab]);

  /* ── Webhook 로그 fetch ── */

  const buildLogUrl = useCallback((cursor: number | null) => {
    const params = new URLSearchParams();
    params.set('limit', String(ITEMS_PER_PAGE));
    if (logStatusFilter) params.set('status', logStatusFilter);
    if (logFrom) params.set('createdFrom', logFrom);
    if (logTo) params.set('createdTo', logTo);
    if (cursor) params.set('cursor', String(cursor));
    return `/api/payments/logs?${params.toString()}`;
  }, [logStatusFilter, logFrom, logTo]);

  const fetchLogs = useCallback(async (cursor: number | null, append: boolean) => {
    if (append) setLogLoadingMore(true);
    else setLogLoading(true);
    setLogError(null);
    try {
      const res = await fetch(buildLogUrl(cursor), { headers: getAuthHeaders() });
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        setLogError(String((p as Record<string, unknown>).error ?? 'Webhook 로그를 불러오지 못했습니다.'));
        return;
      }
      const payload: CursorApiResponse<PaymentLogRow> = await res.json();
      if (append) setLogs((prev) => [...prev, ...(payload.data ?? [])]);
      else setLogs(payload.data ?? []);
      setLogCursor(payload.nextCursor ?? null);
    } catch {
      setLogError('Webhook 로그를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLogLoading(false);
      setLogLoadingMore(false);
    }
  }, [buildLogUrl]);

  useEffect(() => {
    if (activeTab !== 'logs') return;
    setLogs([]);
    setLogCursor(null);
    fetchLogs(null, false);
  }, [fetchLogs, activeTab]);

  /* ── 핸들러 ── */

  const handlePayReset = () => {
    setStatusFilter('');
    setPaidFrom('');
    setPaidTo('');
  };

  const handleLogReset = () => {
    setLogStatusFilter('');
    setLogFrom('');
    setLogTo('');
  };

  const handleCancelled = () => {
    setSelectedPayment(null);
    fetchPayments(null, false);
  };

  /* ── 렌더 ── */

  return (
    <section className="space-y-5 p-6">
      {/* 탭 */}
      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'border-b-2 border-foreground text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-4 w-4" />
          결제 목록
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'border-b-2 border-foreground text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Webhook className="h-4 w-4" />
          Webhook 로그
        </button>
      </div>

      {/* ────── 결제 목록 탭 ────── */}
      {activeTab === 'payments' && (
        <>
          {/* 필터 바 */}
          <Card className="border-border">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-[140px]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Input type="date" value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} className="w-[160px]" />
              <span className="text-sm text-muted-foreground">~</span>
              <Input type="date" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} className="w-[160px]" />
              <Button type="button" variant="outline" size="sm" onClick={handlePayReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                초기화
              </Button>
            </CardContent>
          </Card>

          {/* 테이블 */}
          <Card className="border-border">
            <div className="border-b border-border px-6 py-3">
              <h2 className="text-base font-semibold">결제 목록</h2>
            </div>
            <div className="p-0">
              <Table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>결제번호</TableHead>
                    <TableHead>진료기록</TableHead>
                    <TableHead>결제수단</TableHead>
                    <TableHead className="text-right">결제 금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>결제일시</TableHead>
                    <TableHead>등록일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {payLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">불러오는 중...</TableCell>
                    </TableRow>
                  ) : payError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-destructive">{payError}</TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">결제 내역이 없습니다.</TableCell>
                    </TableRow>
                  ) : (
                    payments.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPayment(item)}>
                        <TableCell className="py-4 whitespace-nowrap">#{item.id}</TableCell>
                        <TableCell className="py-4 whitespace-nowrap">#{item.medicalRecordId}</TableCell>
                        <TableCell className="py-4 whitespace-nowrap">{getMethodLabel(item.paymentMethod)}</TableCell>
                        <TableCell className="py-4 text-right whitespace-nowrap font-semibold">{formatAmount(Number(item.amount))}원</TableCell>
                        <TableCell className="py-4">
                          <Badge className={STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700 hover:bg-gray-100'}>
                            {STATUS_LABELS[item.status] ?? item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 whitespace-nowrap text-muted-foreground">{formatDateTime(item.paidAt)}</TableCell>
                        <TableCell className="py-4 whitespace-nowrap text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {!payLoading && !payError && payCursor !== null && (
              <div className="flex items-center justify-center border-t border-border px-6 py-4">
                <Button type="button" variant="outline" onClick={() => fetchPayments(payCursor, true)} disabled={payLoadingMore} className="gap-1.5">
                  <ChevronDown className="h-4 w-4" />
                  {payLoadingMore ? '불러오는 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ────── Webhook 로그 탭 ────── */}
      {activeTab === 'logs' && (
        <>
          {/* 필터 바 */}
          <Card className="border-border">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <Select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="w-[140px]"
              >
                {LOG_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Input type="date" value={logFrom} onChange={(e) => setLogFrom(e.target.value)} className="w-[160px]" />
              <span className="text-sm text-muted-foreground">~</span>
              <Input type="date" value={logTo} onChange={(e) => setLogTo(e.target.value)} className="w-[160px]" />
              <Button type="button" variant="outline" size="sm" onClick={handleLogReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                초기화
              </Button>
            </CardContent>
          </Card>

          {/* 테이블 */}
          <Card className="border-border">
            <div className="border-b border-border px-6 py-3">
              <h2 className="text-base font-semibold">Webhook 수신 로그</h2>
            </div>
            <div className="p-0">
              <Table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[8%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[17%]" />
                  <col className="w-[17%]" />
                </colgroup>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>SubMID</TableHead>
                    <TableHead>승인번호</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>결제일시</TableHead>
                    <TableHead>수신일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {logLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">불러오는 중...</TableCell>
                    </TableRow>
                  ) : logError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-destructive">{logError}</TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">수신된 Webhook 로그가 없습니다.</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="py-4 whitespace-nowrap">{item.id}</TableCell>
                        <TableCell className="py-4 whitespace-nowrap text-xs font-mono">{item.subMid}</TableCell>
                        <TableCell className="py-4 whitespace-nowrap text-xs font-mono">{item.approveNo ?? '-'}</TableCell>
                        <TableCell className="py-4 text-right whitespace-nowrap font-semibold">{formatAmount(Number(item.amount))}원</TableCell>
                        <TableCell className="py-4">
                          <Badge className={STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700 hover:bg-gray-100'}>
                            {STATUS_LABELS[item.status] ?? item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 whitespace-nowrap text-muted-foreground">{formatDateTime(item.paidAt)}</TableCell>
                        <TableCell className="py-4 whitespace-nowrap text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {!logLoading && !logError && logCursor !== null && (
              <div className="flex items-center justify-center border-t border-border px-6 py-4">
                <Button type="button" variant="outline" onClick={() => fetchLogs(logCursor, true)} disabled={logLoadingMore} className="gap-1.5">
                  <ChevronDown className="h-4 w-4" />
                  {logLoadingMore ? '불러오는 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ────── 결제 상세 Sheet ────── */}
      <Sheet
        open={selectedPayment !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPayment(null);
        }}
      >
        <SheetContent side="right" className="overflow-y-auto">
          {selectedPayment && (
            <>
              <SheetHeader>
                <SheetTitle>결제 상세 #{selectedPayment.id}</SheetTitle>
                <SheetDescription>결제 정보를 확인합니다.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* 기본 정보 */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    기본 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">상태</p>
                      <div className="mt-1">
                        <Badge className={STATUS_COLORS[selectedPayment.status] ?? 'bg-gray-100 text-gray-700 hover:bg-gray-100'}>
                          {STATUS_LABELS[selectedPayment.status] ?? selectedPayment.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">결제 금액</p>
                      <p className="mt-1 font-semibold">{formatAmount(Number(selectedPayment.amount))}원</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">결제수단</p>
                      <p className="mt-1">{getMethodLabel(selectedPayment.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">진료기록</p>
                      <p className="mt-1">#{selectedPayment.medicalRecordId}</p>
                    </div>
                    {selectedPayment.settlementId && (
                      <div>
                        <p className="text-muted-foreground">정산번호</p>
                        <p className="mt-1">#{selectedPayment.settlementId}</p>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="border-border" />

                {/* PG 정보 */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    PG 정보
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">승인번호</p>
                      <p className="mt-1">{selectedPayment.approveNo ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">PG 거래 ID</p>
                      <p className="mt-1 break-all">{selectedPayment.pgTransactionId ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">가맹점 (SubMID)</p>
                      <p className="mt-1">{selectedPayment.subMid}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* 일시 정보 */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    일시 정보
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">결제일시</p>
                      <p className="mt-1">{formatDateTime(selectedPayment.paidAt)}</p>
                    </div>
                    {selectedPayment.cancelledAt && (
                      <div>
                        <p className="text-muted-foreground">취소일시</p>
                        <p className="mt-1">{formatDateTime(selectedPayment.cancelledAt)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">등록일시</p>
                      <p className="mt-1">{formatDateTime(selectedPayment.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* 결제 취소 */}
                {selectedPayment.status === 'PAID' && (
                  <>
                    <hr className="border-border" />
                    <CancelSection payment={selectedPayment} onCancelled={handleCancelled} />
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
