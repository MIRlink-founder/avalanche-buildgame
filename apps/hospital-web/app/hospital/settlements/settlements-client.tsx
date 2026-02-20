'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '정산 대기',
  SETTLED: '정산 완료',
};

const SETTLEMENT_STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  SETTLED: 'bg-blue-600 text-white hover:bg-blue-600',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  READY: '결제 대기',
  PAID: '결제 완료',
  SETTLED: '정산 완료',
  CANCELLED: '결제 취소',
  FAILED: '결제 실패',
  PENDING: '결제 대기',
  PARTIAL_CANCELLED: '부분 취소',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  READY: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  PENDING: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
  PAID: 'bg-blue-600 text-white hover:bg-blue-600',
  SETTLED: 'bg-blue-600 text-white hover:bg-blue-600',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
  FAILED: 'bg-red-100 text-red-800 hover:bg-red-100',
  PARTIAL_CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: '카드',
  CASH: '현금',
  TRANSFER: '계좌이체',
  VIRTUAL_ACCOUNT: '가상계좌',
  MIXED: '복합결제',
};

const LIST_LIMIT = 50;

export function SettlementsClient() {
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
    if (!initialAccount) return accountReady;
    return (
      bank !== (initialAccount.accountBank ?? '') ||
      number !== (initialAccount.accountNumber ?? '') ||
      holder !== (initialAccount.accountHolder ?? '')
    );
  }, [accountBank, accountHolder, accountNumber, accountReady, initialAccount]);

  const canSaveAccount = accountReady && isAccountDirty;

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
      setAccountMessage('정산 계좌가 저장되었습니다.');
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

  return (
    <section className="space-y-6 p-6">
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

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="border-border border-b">
              <CardTitle className="text-base">정산 내역</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                최근 정산 내역 {LIST_LIMIT}건 기준
              </CardDescription>
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
                  ) : settlements.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        정산 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    settlements.map((item) => (
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
                            {SETTLEMENT_STATUS_LABELS[item.status] ??
                              item.status}
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
          </Card>

          <Card className="border-border">
            <CardHeader className="border-border border-b">
              <CardTitle className="text-base">결제 내역</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                최근 결제 내역 {LIST_LIMIT}건 기준
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="min-w-[760px] text-sm">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[160px]">결제일</TableHead>
                    <TableHead className="text-right">결제 금액</TableHead>
                    <TableHead className="w-[120px]">결제 수단</TableHead>
                    <TableHead className="w-[120px]">상태</TableHead>
                    <TableHead className="w-[160px]">승인 번호</TableHead>
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
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        결제 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
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
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="border-border border-b">
              <CardTitle className="text-base">정산 계좌 입력</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                정산금 입금을 받을 계좌 정보를 등록해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">은행명</Label>
                <Input
                  value={accountBank}
                  onChange={(event) => setAccountBank(event.target.value)}
                  placeholder="은행명"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  계좌번호
                </Label>
                <Input
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  placeholder="계좌번호"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">예금주</Label>
                <Input
                  value={accountHolder}
                  onChange={(event) => setAccountHolder(event.target.value)}
                  placeholder="예금주명"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchAccount}
                  disabled={accountLoading}
                >
                  계좌 조회
                </Button>
                <Button
                  type="button"
                  onClick={handleAccountSave}
                  disabled={accountLoading || !canSaveAccount}
                >
                  저장하기
                </Button>
              </div>
              {accountError && (
                <p className="text-sm text-destructive">{accountError}</p>
              )}
              {accountMessage && (
                <p className="text-sm text-primary">{accountMessage}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
