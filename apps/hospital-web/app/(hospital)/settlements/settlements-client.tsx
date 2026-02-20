'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@mire/ui/components/badge';
import { Button } from '@mire/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import { Input } from '@mire/ui/components/input';
import { Label } from '@mire/ui/components/label';
import { Tabs } from '@/components/layout/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mire/ui/components/table';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';

interface SettlementRow {
  id: number;
  publicId?: string;
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
}

interface PaymentRow {
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
}

interface SettlementAccount {
  accountBank: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
}

interface SettlementsResponse {
  data: SettlementRow[];
  nextCursor: number | null;
}

interface PaymentsResponse {
  data: PaymentRow[];
  nextCursor: number | null;
}

type PaymentSortKey = 'paidAt' | 'amount' | 'method' | 'status' | 'approveNo';

type PaymentSortConfig = {
  key: PaymentSortKey;
  direction: 'asc' | 'desc';
};

const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '대기',
  SETTLED: '완료',
};

const SETTLEMENT_STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  SETTLED: 'bg-blue-600 text-white hover:bg-blue-600',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  READY: '대기',
  PENDING: '대기',
  PAID: '완료',
  SETTLED: '완료',
  CANCELLED: '취소',
  FAILED: '취소',
  PARTIAL_CANCELLED: '취소',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  READY: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  PENDING: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  PAID: 'bg-blue-600 text-white hover:bg-blue-600',
  SETTLED: 'bg-blue-600 text-white hover:bg-blue-600',
  CANCELLED: 'bg-red-600 text-white hover:bg-red-600',
  FAILED: 'bg-red-600 text-white hover:bg-red-600',
  PARTIAL_CANCELLED: 'bg-red-600 text-white hover:bg-red-600',
};

const PAYMENT_STATUS_ORDER: Record<string, number> = {
  READY: 0,
  PENDING: 1,
  PAID: 2,
  SETTLED: 3,
  PARTIAL_CANCELLED: 4,
  CANCELLED: 5,
  FAILED: 6,
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: '카드',
  CASH: '현금',
  TRANSFER: '계좌이체',
  VIRTUAL_ACCOUNT: '가상계좌',
  MIXED: '복합결제',
};

const LIST_LIMIT = 50;
const SETTLEMENT_PAGE_SIZE = 5;
const PAYMENT_PAGE_SIZE = 5;

export function SettlementsClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const currentTab =
    tabParam === 'settlements' ||
    tabParam === 'payments' ||
    tabParam === 'account'
      ? tabParam
      : 'settlements';
  const paymentStatusParam = searchParams.get('paymentStatus');
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [settlementsError, setSettlementsError] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [initialAccount, setInitialAccount] =
    useState<SettlementAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settlementPage, setSettlementPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentFrom, setPaymentFrom] = useState('');
  const [paymentTo, setPaymentTo] = useState('');
  const [appliedPaymentSearch, setAppliedPaymentSearch] = useState('');
  const [appliedPaymentFrom, setAppliedPaymentFrom] = useState('');
  const [appliedPaymentTo, setAppliedPaymentTo] = useState('');
  const [paymentSortConfig, setPaymentSortConfig] =
    useState<PaymentSortConfig | null>(null);

  const fetchSettlements = useCallback(async () => {
    setSettlementsLoading(true);
    setSettlementsError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(LIST_LIMIT));
      const res = await fetch(`/api/settlements?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setSettlementsError(
          payload.error || '정산 내역을 불러오지 못했습니다.',
        );
        return;
      }
      const payload: SettlementsResponse = await res.json();
      setSettlements(payload.data ?? []);
    } catch {
      setSettlementsError('정산 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setSettlementsLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(LIST_LIMIT));
      const res = await fetch(`/api/payments?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setPaymentsError(payload.error || '결제 내역을 불러오지 못했습니다.');
        return;
      }
      const payload: PaymentsResponse = await res.json();
      setPayments(payload.data ?? []);
    } catch {
      setPaymentsError('결제 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const fetchAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError(null);
    setAccountMessage(null);
    try {
      const res = await fetch('/api/hospitals/settlement-account', {
        headers: getAuthHeaders(),
      });
      if (redirectIfUnauthorized(res)) return;
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setAccountError(payload.error || '정산 계좌를 불러오지 못했습니다.');
        return;
      }
      const payload = (await res.json()) as { data?: SettlementAccount };
      const account = payload.data ?? {
        accountBank: null,
        accountNumber: null,
        accountHolder: null,
      };
      setInitialAccount(account);
      setAccountBank(account.accountBank ?? '');
      setAccountNumber(account.accountNumber ?? '');
      setAccountHolder(account.accountHolder ?? '');
    } catch {
      setAccountError('정산 계좌를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
    fetchPayments();
    fetchAccount();
  }, [fetchSettlements, fetchPayments, fetchAccount]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const totalSettlements = settlements.length;
  const totalSettlementPages = Math.max(
    1,
    Math.ceil(totalSettlements / SETTLEMENT_PAGE_SIZE),
  );
  const clampedSettlementPage = Math.min(settlementPage, totalSettlementPages);
  const settlementStartIndex =
    (clampedSettlementPage - 1) * SETTLEMENT_PAGE_SIZE;
  const settlementEndIndex = Math.min(
    settlementStartIndex + SETTLEMENT_PAGE_SIZE,
    totalSettlements,
  );
  const settlementStartLabel =
    totalSettlements === 0 ? 0 : settlementStartIndex + 1;
  const settlementEndLabel = totalSettlements === 0 ? 0 : settlementEndIndex;
  const settlementLabel = useMemo(() => {
    return `총 ${totalSettlements}개 중 ${settlementStartLabel}-${settlementEndLabel} 표시`;
  }, [settlementEndLabel, settlementStartLabel, totalSettlements]);

  const pagedSettlements = useMemo(() => {
    return settlements.slice(settlementStartIndex, settlementEndIndex);
  }, [settlements, settlementEndIndex, settlementStartIndex]);

  useEffect(() => {
    setSettlementPage(1);
  }, [totalSettlements]);

  const paymentStatusFilter = useMemo(() => {
    if (paymentStatusParam === 'paid') {
      return new Set(['PAID', 'SETTLED']);
    }
    if (paymentStatusParam === 'pending') {
      return new Set(['READY', 'PENDING']);
    }
    if (paymentStatusParam === 'cancelled') {
      return new Set(['CANCELLED', 'FAILED', 'PARTIAL_CANCELLED']);
    }
    return null;
  }, [paymentStatusParam]);

  const filteredPayments = useMemo(() => {
    let items = payments;

    if (paymentStatusFilter) {
      items = items.filter((payment) =>
        paymentStatusFilter.has(payment.status),
      );
    }

    const query = appliedPaymentSearch.trim().toLowerCase();
    if (query) {
      items = items.filter((payment) => {
        const targetValues = [
          String(payment.id),
          String(payment.medicalRecordId ?? ''),
          payment.approveNo ?? '',
          payment.pgTransactionId ?? '',
        ];
        return targetValues.some((value) =>
          value.toLowerCase().includes(query),
        );
      });
    }

    if (appliedPaymentFrom || appliedPaymentTo) {
      const fromDate = appliedPaymentFrom
        ? new Date(`${appliedPaymentFrom}T00:00:00`)
        : null;
      const toDate = appliedPaymentTo
        ? new Date(`${appliedPaymentTo}T23:59:59`)
        : null;

      items = items.filter((payment) => {
        const raw = payment.paidAt ?? payment.createdAt;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) {
          return false;
        }
        if (fromDate && date < fromDate) {
          return false;
        }
        if (toDate && date > toDate) {
          return false;
        }
        return true;
      });
    }

    return items;
  }, [
    payments,
    paymentStatusFilter,
    appliedPaymentSearch,
    appliedPaymentFrom,
    appliedPaymentTo,
  ]);

  const sortedPayments = useMemo(() => {
    if (!paymentSortConfig) {
      return filteredPayments;
    }

    const direction = paymentSortConfig.direction === 'asc' ? 1 : -1;

    const toNumber = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const getValue = (payment: PaymentRow) => {
      switch (paymentSortConfig.key) {
        case 'paidAt':
          return new Date(payment.paidAt ?? payment.createdAt);
        case 'amount':
          return toNumber(payment.amount);
        case 'method':
          return payment.paymentMethod ?? '';
        case 'status':
          return PAYMENT_STATUS_ORDER[payment.status] ?? 99;
        case 'approveNo':
          return payment.approveNo ?? payment.pgTransactionId ?? '';
        default:
          return null;
      }
    };

    const sorted = [...filteredPayments];
    sorted.sort((a, b) => {
      const aValue = getValue(a);
      const bValue = getValue(b);

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (aValue instanceof Date && bValue instanceof Date) {
        return (aValue.getTime() - bValue.getTime()) * direction;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue), 'ko') * direction;
    });

    return sorted;
  }, [filteredPayments, paymentSortConfig]);

  const totalPayments = sortedPayments.length;
  const totalPaymentPages = Math.max(
    1,
    Math.ceil(totalPayments / PAYMENT_PAGE_SIZE),
  );
  const clampedPaymentPage = Math.min(paymentPage, totalPaymentPages);
  const paymentStartIndex = (clampedPaymentPage - 1) * PAYMENT_PAGE_SIZE;
  const paymentEndIndex = Math.min(
    paymentStartIndex + PAYMENT_PAGE_SIZE,
    totalPayments,
  );
  const paymentStartLabel = totalPayments === 0 ? 0 : paymentStartIndex + 1;
  const paymentEndLabel = totalPayments === 0 ? 0 : paymentEndIndex;
  const paymentLabel = useMemo(() => {
    return `총 ${totalPayments}개 중 ${paymentStartLabel}-${paymentEndLabel} 표시`;
  }, [paymentEndLabel, paymentStartLabel, totalPayments]);

  const pagedPayments = useMemo(() => {
    return sortedPayments.slice(paymentStartIndex, paymentEndIndex);
  }, [sortedPayments, paymentEndIndex, paymentStartIndex]);

  useEffect(() => {
    setPaymentPage(1);
  }, [
    totalPayments,
    paymentStatusParam,
    appliedPaymentSearch,
    appliedPaymentFrom,
    appliedPaymentTo,
  ]);

  const settlementSummary = useMemo(() => {
    return settlements.reduce(
      (acc, item) => {
        const totalVolume = toNumber(item.totalVolume);
        const payback = toNumber(item.paybackAmount);
        acc.totalVolume += totalVolume;
        acc.totalPayback += payback;
        if (item.status === 'SETTLED') {
          acc.settled += payback;
        } else {
          acc.pending += payback;
        }
        return acc;
      },
      { totalVolume: 0, totalPayback: 0, settled: 0, pending: 0 },
    );
  }, [settlements]);

  const paymentSummary = useMemo(() => {
    return payments.reduce(
      (acc, item) => {
        const amount = toNumber(item.amount);
        if (item.status === 'PAID' || item.status === 'SETTLED') {
          acc.paid += amount;
        } else if (item.status === 'CANCELLED' || item.status === 'FAILED') {
          acc.cancelled += amount;
        }
        acc.total += amount;
        return acc;
      },
      { total: 0, paid: 0, cancelled: 0 },
    );
  }, [payments]);

  const accountReady = useMemo(() => {
    return Boolean(
      accountBank.trim() && accountNumber.trim() && accountHolder.trim(),
    );
  }, [accountBank, accountNumber, accountHolder]);

  const isAccountDirty = useMemo(() => {
    const bank = accountBank.trim();
    const number = accountNumber.trim();
    const holder = accountHolder.trim();
    if (!initialAccount) {
      return Boolean(bank || number || holder);
    }
    return (
      bank !== (initialAccount.accountBank ?? '') ||
      number !== (initialAccount.accountNumber ?? '') ||
      holder !== (initialAccount.accountHolder ?? '')
    );
  }, [accountBank, accountHolder, accountNumber, initialAccount]);

  const canSaveAccount = isAccountDirty;

  const handleAccountSave = async () => {
    setAccountError(null);
    setAccountMessage(null);
    if (!accountReady) {
      setAccountError('정산 계좌 정보를 모두 입력해주세요.');
      return;
    }
    if (!isAccountDirty) {
      setAccountMessage('변경된 내용이 없습니다.');
      return;
    }
    setAccountLoading(true);
    try {
      const res = await fetch('/api/hospitals/settlement-account', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountBank: accountBank.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
        }),
      });
      if (redirectIfUnauthorized(res)) return;
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAccountError(payload.error || '정산 계좌 저장에 실패했습니다.');
        return;
      }
      setAccountMessage(null);
      setToastMessage('정산 계좌가 저장되었습니다');
      setInitialAccount({
        accountBank: accountBank.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });
    } catch {
      setAccountError('정산 계좌 저장 중 오류가 발생했습니다.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePaymentSearch = () => {
    setAppliedPaymentSearch(paymentSearch);
    setAppliedPaymentFrom(paymentFrom);
    setAppliedPaymentTo(paymentTo);
    setPaymentPage(1);
  };

  const handlePaymentSort = (key: PaymentSortKey) => {
    setPaymentSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const getPaymentSortIcon = (key: PaymentSortKey) => {
    if (paymentSortConfig?.key !== key) {
      return (
        <span
          className="inline-flex flex-col items-center gap-[1px]"
          aria-hidden
        >
          <span className="inline-block h-0 w-0 border-x-[4px] border-x-transparent border-b-[4px] border-b-muted-foreground/50" />
          <span className="inline-block h-0 w-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-muted-foreground/50" />
        </span>
      );
    }

    return paymentSortConfig.direction === 'asc' ? (
      <span
        className="inline-block h-0 w-0 border-x-[4px] border-x-transparent border-b-[4px] border-b-muted-foreground"
        aria-hidden
      />
    ) : (
      <span
        className="inline-block h-0 w-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-muted-foreground"
        aria-hidden
      />
    );
  };

  const getSortButtonClass = (align: 'left' | 'center' | 'right') => {
    const alignClass =
      align === 'center'
        ? 'justify-center'
        : align === 'right'
          ? 'justify-end'
          : 'justify-start';
    return `inline-flex w-full items-center gap-1 ${alignClass}`;
  };

  return (
    <section className="space-y-6 p-6">
      {toastMessage && (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {toastMessage}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold">
              총 매출
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatAmount(String(paymentSummary.paid))}원
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              최근 결제 {LIST_LIMIT}건 기준
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold">
              정산 대기 금액
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatAmount(String(settlementSummary.pending))}원
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              정산 내역 {LIST_LIMIT}건 기준
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold">
              정산 완료 금액
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatAmount(String(settlementSummary.settled))}원
            </p>
            <p className="text-muted-foreground mt-2 text-xs">완료 처리 기준</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-semibold">
              총 정산금
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatAmount(String(settlementSummary.totalPayback))}원
            </p>
            <p className="text-muted-foreground mt-2 text-xs">정산 내역 합산</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: 'settlements', label: '정산 내역' },
          { id: 'payments', label: '결제 내역' },
          { id: 'account', label: '정산 계좌' },
        ]}
        basePath="/settlements"
        paramName="tab"
        defaultTab="settlements"
      />

      {currentTab === 'settlements' && (
        <Card className="border-border">
          <CardHeader className="border-border border-b">
            <CardTitle className="text-base">정산 내역</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="min-w-[720px] text-sm">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[160px]">정산 기간</TableHead>
                  <TableHead className="text-right">거래액</TableHead>
                  <TableHead className="text-right">정산금액</TableHead>
                  <TableHead className="w-[120px]">정산 상태</TableHead>
                  <TableHead className="w-[120px]">정산일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {settlementsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : settlementsError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-destructive"
                    >
                      {settlementsError}
                    </TableCell>
                  </TableRow>
                ) : pagedSettlements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      정산 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedSettlements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {formatPeriod(
                          item.settlementPeriodStart,
                          item.settlementPeriodEnd,
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                        {formatAmount(item.totalVolume)}원
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                        {formatAmount(item.paybackAmount)}원
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          className={
                            SETTLEMENT_STATUS_COLORS[item.status] ??
                            'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          }
                        >
                          {SETTLEMENT_STATUS_LABELS[item.status] ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {item.settledAt ? formatDate(item.settledAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <div className="flex min-h-10 items-center justify-between px-4 py-3">
            <p className="text-muted-foreground text-sm">
              {settlementsLoading
                ? '데이터를 불러오는 중입니다'
                : settlementLabel}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSettlementPage(Math.max(1, clampedSettlementPage - 1))
                }
                disabled={clampedSettlementPage === 1 || settlementsLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[2.5rem] bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
                disabled
              >
                {clampedSettlementPage}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSettlementPage(
                    Math.min(totalSettlementPages, clampedSettlementPage + 1),
                  )
                }
                disabled={
                  clampedSettlementPage === totalSettlementPages ||
                  settlementsLoading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {currentTab === 'payments' && (
        <Card className="border-border">
          <CardHeader className="border-border border-b">
            <CardTitle className="text-base">결제 내역</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b px-4 py-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] w-[280px] space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    승인번호/결제 ID
                  </Label>
                  <Input
                    value={paymentSearch}
                    onChange={(event) => setPaymentSearch(event.target.value)}
                    placeholder="승인번호 또는 결제 ID"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      결제일
                    </Label>
                    <Input
                      type="date"
                      value={paymentFrom}
                      onChange={(event) => setPaymentFrom(event.target.value)}
                      className="min-w-[150px]"
                    />
                  </div>
                  <span className="text-muted-foreground pb-2 text-sm">~</span>
                  <div className="space-y-2">
                    <Label className="sr-only">결제일 종료</Label>
                    <Input
                      type="date"
                      value={paymentTo}
                      onChange={(event) => setPaymentTo(event.target.value)}
                      className="min-w-[150px]"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="xl"
                  onClick={handlePaymentSearch}
                  disabled={paymentsLoading}
                  className="w-full md:w-auto"
                >
                  조회
                </Button>
              </div>
              <div className="mt-4">
                <Tabs
                  tabs={[
                    { id: 'all', label: '전체' },
                    { id: 'paid', label: '결제 완료' },
                    { id: 'pending', label: '결제 대기' },
                    { id: 'cancelled', label: '결제 취소' },
                  ]}
                  basePath="/settlements"
                  paramName="paymentStatus"
                  defaultTab="all"
                  preserveParams
                />
              </div>
            </div>
            <Table className="min-w-[760px] text-sm">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[160px]">
                    <button
                      type="button"
                      onClick={() => handlePaymentSort('paidAt')}
                      className={getSortButtonClass('left')}
                    >
                      <span>결제일</span>
                      {getPaymentSortIcon('paidAt')}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => handlePaymentSort('amount')}
                      className={getSortButtonClass('right')}
                    >
                      <span>결제 금액</span>
                      {getPaymentSortIcon('amount')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <button
                      type="button"
                      onClick={() => handlePaymentSort('method')}
                      className={getSortButtonClass('left')}
                    >
                      <span>결제 수단</span>
                      {getPaymentSortIcon('method')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <button
                      type="button"
                      onClick={() => handlePaymentSort('status')}
                      className={getSortButtonClass('left')}
                    >
                      <span>결제 상태</span>
                      {getPaymentSortIcon('status')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[160px]">
                    <button
                      type="button"
                      onClick={() => handlePaymentSort('approveNo')}
                      className={getSortButtonClass('left')}
                    >
                      <span>승인 번호</span>
                      {getPaymentSortIcon('approveNo')}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {paymentsLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : paymentsError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-destructive"
                    >
                      {paymentsError}
                    </TableCell>
                  </TableRow>
                ) : pagedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      결제 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(payment.paidAt ?? payment.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                        {formatAmount(payment.amount)}원
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {PAYMENT_METHOD_LABELS[payment.paymentMethod ?? ''] ??
                          payment.paymentMethod ??
                          '-'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          className={
                            PAYMENT_STATUS_COLORS[payment.status] ??
                            'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          }
                        >
                          {PAYMENT_STATUS_LABELS[payment.status] ??
                            payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs">
                        {payment.approveNo ?? payment.pgTransactionId ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <div className="flex min-h-10 items-center justify-between px-4 py-3">
            <p className="text-muted-foreground text-sm">
              {paymentsLoading ? '데이터를 불러오는 중입니다' : paymentLabel}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPaymentPage(Math.max(1, clampedPaymentPage - 1))
                }
                disabled={clampedPaymentPage === 1 || paymentsLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[2.5rem] bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
                disabled
              >
                {clampedPaymentPage}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPaymentPage(
                    Math.min(totalPaymentPages, clampedPaymentPage + 1),
                  )
                }
                disabled={
                  clampedPaymentPage === totalPaymentPages || paymentsLoading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {currentTab === 'account' && (
        <Card className="border-border">
          <CardHeader className="border-border border-b">
            <CardTitle className="text-base">정산 계좌 입력</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              정산금 입금을 받을 계좌 정보를 등록해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr_1fr_auto]">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">은행명</Label>
                <Input
                  value={accountBank}
                  onChange={(event) => {
                    setAccountBank(event.target.value);
                    setAccountError(null);
                    setAccountMessage(null);
                  }}
                  placeholder="은행명"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  계좌번호
                </Label>
                <Input
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(event.target.value);
                    setAccountError(null);
                    setAccountMessage(null);
                  }}
                  placeholder="계좌번호"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">예금주</Label>
                <Input
                  value={accountHolder}
                  onChange={(event) => {
                    setAccountHolder(event.target.value);
                    setAccountError(null);
                    setAccountMessage(null);
                  }}
                  placeholder="예금주명"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  onClick={handleAccountSave}
                  disabled={accountLoading || !canSaveAccount}
                  size="xl"
                  className="w-full md:w-auto"
                >
                  저장
                </Button>
              </div>
            </div>
            {accountError && (
              <p className="text-sm text-destructive">{accountError}</p>
            )}
            {accountMessage && (
              <p className="text-sm text-primary">{accountMessage}</p>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function formatAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }
  return new Intl.NumberFormat('ko-KR').format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('ko-KR');
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPeriod(start: string, end: string) {
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
