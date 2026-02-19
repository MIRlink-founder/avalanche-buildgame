'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faChartBar,
  faCircleCheck,
  faCreditCard,
  faMoneyBill1,
  faRectangleList,
} from '@fortawesome/free-regular-svg-icons';
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

type BankTransferRow = {
  id: number;
  settlementId: number;
  amount: string;
  accountNumber: string;
  bankName: string;
  transferStatus: string | null;
  transferResult: string | null;
  transferredAt: string | null;
  createdAt: string;
};

type SettlementDetail = {
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
  payments?: PaymentRow[];
  bankTransfers?: BankTransferRow[];
};

type SettlementAccount = {
  hospitalId: string;
  accountBank: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '정산 대기',
  SETTLED: '정산 완료',
};

const MOCK_DETAILS: Record<string, SettlementDetail> = {
  '101': {
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
    payments: [
      {
        id: 3102,
        medicalRecordId: 8801,
        hospitalId: 'HOS-2026-001',
        settlementId: 101,
        subMid: 'MID-AX01',
        approveNo: 'A43812',
        pgTransactionId: 'TX-20260218-001',
        amount: '450000',
        paymentMethod: 'CARD',
        status: 'PAID',
        paidAt: '2026-02-18T10:12:00.000Z',
        cancelledAt: null,
        createdAt: '2026-02-18T10:12:00.000Z',
      },
      {
        id: 3103,
        medicalRecordId: 8814,
        hospitalId: 'HOS-2026-001',
        settlementId: 101,
        subMid: 'MID-AX01',
        approveNo: 'A43835',
        pgTransactionId: 'TX-20260220-014',
        amount: '720000',
        paymentMethod: 'CARD',
        status: 'PAID',
        paidAt: '2026-02-20T15:40:00.000Z',
        cancelledAt: null,
        createdAt: '2026-02-20T15:40:00.000Z',
      },
    ],
    bankTransfers: [
      {
        id: 9001,
        settlementId: 101,
        amount: '11562500',
        accountNumber: '110-234-998877',
        bankName: '신한',
        transferStatus: 'PENDING',
        transferResult: null,
        transferredAt: null,
        createdAt: '2026-03-01T10:30:00.000Z',
      },
    ],
  },
  '100': {
    id: 100,
    hospitalId: 'HOS-2026-014',
    settlementPeriodStart: '2026-01-01',
    settlementPeriodEnd: '2026-01-31',
    totalVolume: '9800000',
    appliedRate: '90.00',
    paybackAmount: '8820000',
    isNftBoosted: false,
    status: 'SETTLED',
    settledAt: '2026-02-05T10:30:00.000Z',
    createdAt: '2026-02-01T08:10:00.000Z',
    payments: [
      {
        id: 3007,
        medicalRecordId: 8702,
        hospitalId: 'HOS-2026-014',
        settlementId: 100,
        subMid: 'MID-BX77',
        approveNo: 'B30210',
        pgTransactionId: 'TX-20260105-044',
        amount: '320000',
        paymentMethod: 'CARD',
        status: 'PAID',
        paidAt: '2026-01-05T09:30:00.000Z',
        cancelledAt: null,
        createdAt: '2026-01-05T09:30:00.000Z',
      },
      {
        id: 3011,
        medicalRecordId: 8710,
        hospitalId: 'HOS-2026-014',
        settlementId: 100,
        subMid: 'MID-BX77',
        approveNo: 'B30278',
        pgTransactionId: 'TX-20260118-082',
        amount: '510000',
        paymentMethod: 'TRANSFER',
        status: 'PAID',
        paidAt: '2026-01-18T11:12:00.000Z',
        cancelledAt: null,
        createdAt: '2026-01-18T11:12:00.000Z',
      },
    ],
    bankTransfers: [
      {
        id: 8802,
        settlementId: 100,
        amount: '8820000',
        accountNumber: '302-44-123456',
        bankName: '국민',
        transferStatus: 'SUCCESS',
        transferResult: '정상 이체 완료',
        transferredAt: '2026-02-05T10:20:00.000Z',
        createdAt: '2026-02-05T09:55:00.000Z',
      },
    ],
  },
};

const MOCK_ACCOUNTS: Record<string, SettlementAccount> = {
  'HOS-2026-001': {
    hospitalId: 'HOS-2026-001',
    accountBank: '신한',
    accountNumber: '110-234-998877',
    accountHolder: '이튼튼치과',
  },
  'HOS-2026-014': {
    hospitalId: 'HOS-2026-014',
    accountBank: '국민',
    accountNumber: '302-44-123456',
    accountHolder: '포레스트치과',
  },
};

const FALLBACK_DETAIL = MOCK_DETAILS['101'];
const FALLBACK_ACCOUNT = MOCK_ACCOUNTS['HOS-2026-001'];

function getMockDetail(id: string) {
  return MOCK_DETAILS[id] ?? FALLBACK_DETAIL;
}

function getMockAccount(hospitalId: string) {
  return MOCK_ACCOUNTS[hospitalId] ?? FALLBACK_ACCOUNT;
}

type SettlementDetailResponse = {
  data: SettlementDetail;
};

type SettlementAccountResponse = {
  data: SettlementAccount;
};

export function SettlementDetailClient({
  settlementId,
}: {
  settlementId: string;
}) {
  const [detail, setDetail] = useState<SettlementDetail>(() =>
    getMockDetail(settlementId),
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);
  const [isAdjustSaving, setIsAdjustSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);

  const payments = detail.payments ?? [];
  const bankTransfers = detail.bankTransfers ?? [];

  const statusLabel = STATUS_LABELS[detail.status] ?? detail.status;
  const periodLabel = formatPeriod(
    detail.settlementPeriodStart,
    detail.settlementPeriodEnd,
  );
  const isSettled = detail.status === 'SETTLED';

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다');
        return;
      }

      const response = await fetch(
        `/api/settlements/${settlementId}?includePayments=true&includeTransfers=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response
        .json()
        .catch(() => ({}))) as Partial<SettlementDetailResponse> & {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error || '정산 상세 조회에 실패했습니다');
        return;
      }

      if (payload.data) {
        setDetail(payload.data);
      }
    } catch (fetchError) {
      setError('정산 상세 조회 중 오류가 발생했습니다');
      console.error(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [settlementId]);

  const applyAccount = useCallback((account: SettlementAccount) => {
    setAccountBank(account.accountBank ?? '');
    setAccountNumber(account.accountNumber ?? '');
    setAccountHolder(account.accountHolder ?? '');
  }, []);

  const fetchAccount = useCallback(async () => {
    if (!detail.hospitalId) {
      setAccountError('병원 정보를 확인할 수 없습니다');
      return;
    }

    setIsAccountLoading(true);
    setAccountError(null);
    setAccountMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAccountError('로그인이 필요합니다');
        return;
      }

      const params = new URLSearchParams();
      params.set('hospitalId', detail.hospitalId);

      const response = await fetch(
        `/api/hospitals/settlement-account?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response
        .json()
        .catch(() => ({}))) as Partial<SettlementAccountResponse> & {
        error?: string;
      };

      if (!response.ok) {
        setAccountError(payload.error || '정산 계좌 조회에 실패했습니다');
        return;
      }

      if (payload.data) {
        applyAccount(payload.data);
        setAccountMessage('정산 계좌를 불러왔습니다');
      }
    } catch (fetchError) {
      setAccountError('정산 계좌 조회 중 오류가 발생했습니다');
      console.error(fetchError);
    } finally {
      setIsAccountLoading(false);
    }
  }, [detail.hospitalId, applyAccount]);

  const handleSaveAccount = async () => {
    if (!detail.hospitalId) {
      setAccountError('병원 정보를 확인할 수 없습니다');
      return;
    }

    if (!accountBank.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      setAccountError('정산 계좌 정보를 모두 입력해주세요');
      return;
    }

    setIsAccountLoading(true);
    setAccountError(null);
    setAccountMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAccountError('로그인이 필요합니다');
        return;
      }

      const params = new URLSearchParams();
      params.set('hospitalId', detail.hospitalId);

      const response = await fetch(
        `/api/hospitals/settlement-account?${params.toString()}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accountBank: accountBank.trim(),
            accountNumber: accountNumber.trim(),
            accountHolder: accountHolder.trim(),
          }),
        },
      );

      const payload = (await response
        .json()
        .catch(() => ({}))) as Partial<SettlementAccountResponse> & {
        error?: string;
      };

      if (!response.ok) {
        setAccountError(payload.error || '정산 계좌 저장에 실패했습니다');
        return;
      }

      if (payload.data) {
        applyAccount(payload.data);
        setAccountMessage('정산 계좌가 저장되었습니다');
      }
    } catch (saveError) {
      setAccountError('정산 계좌 저장 중 오류가 발생했습니다');
      console.error(saveError);
    } finally {
      setIsAccountLoading(false);
    }
  };

  useEffect(() => {
    setDetail(getMockDetail(settlementId));
    setError(null);
  }, [settlementId]);

  useEffect(() => {
    applyAccount(getMockAccount(detail.hospitalId));
    setAccountError(null);
    setAccountMessage(null);
  }, [detail.hospitalId, applyAccount]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchDetail();
    }
  }, [fetchDetail]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && detail.hospitalId) {
      fetchAccount();
    }
  }, [detail.hospitalId, fetchAccount]);

  const summaryCards = useMemo(
    () => [
      {
        label: '총 거래액',
        value: `${formatAmount(detail.totalVolume)}원`,
      },
      {
        label: '정산율',
        value: `${formatRate(detail.appliedRate)}%`,
      },
      {
        label: '페이백',
        value: `${formatAmount(detail.paybackAmount)}원`,
      },
      {
        label: '정산 상태',
        value: statusLabel,
      },
    ],
    [detail.appliedRate, detail.paybackAmount, detail.totalVolume, statusLabel],
  );

  const [draftRate, setDraftRate] = useState(detail.appliedRate);
  const [draftPayback, setDraftPayback] = useState(detail.paybackAmount);

  useEffect(() => {
    setDraftRate(detail.appliedRate);
    setDraftPayback(detail.paybackAmount);
  }, [detail.appliedRate, detail.paybackAmount]);

  const totalVolumeValue = parseNumber(detail.totalVolume);
  const draftRateValue = parseNumber(draftRate);
  const draftPaybackValue = parseNumber(draftPayback);
  const autoPayback = Number.isFinite(totalVolumeValue)
    ? Number.isFinite(draftRateValue)
      ? (totalVolumeValue * draftRateValue) / 100
      : null
    : null;
  const previewPayback = Number.isFinite(draftPaybackValue)
    ? draftPaybackValue
    : autoPayback;

  const handleApplyAutoPayback = () => {
    if (autoPayback === null || !Number.isFinite(autoPayback)) {
      return;
    }
    setDraftPayback(autoPayback.toFixed(2));
  };

  const handleChangeStatus = async (
    nextStatus: 'PENDING_PAYMENT' | 'SETTLED',
  ) => {
    setStatusError(null);
    setStatusMessage(null);
    setIsStatusSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setStatusError('로그인이 필요합니다');
        return;
      }

      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as Partial<SettlementDetailResponse> & {
        error?: string;
      };

      if (!response.ok) {
        setStatusError(payload.error || '정산 상태 변경에 실패했습니다');
        return;
      }

      if (payload.data) {
        const updated = payload.data;
        setDetail((prev) => ({
          ...prev,
          status: updated.status,
          settledAt: updated.settledAt,
        }));
        setStatusMessage('정산 상태가 변경되었습니다');
      }
    } catch (saveError) {
      setStatusError('정산 상태 변경 중 오류가 발생했습니다');
      console.error(saveError);
    } finally {
      setIsStatusSaving(false);
    }
  };

  const handleSaveAdjustment = async () => {
    setAdjustError(null);
    setAdjustMessage(null);

    const rateValue = parseNumber(draftRate);
    const paybackValue = parseNumber(draftPayback);

    if (!Number.isFinite(rateValue) || rateValue < 0 || rateValue > 100) {
      setAdjustError('정산율은 0에서 100 사이 숫자여야 합니다');
      return;
    }

    if (!Number.isFinite(paybackValue) || paybackValue < 0) {
      setAdjustError('페이백 금액은 0 이상이어야 합니다');
      return;
    }

    setIsAdjustSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAdjustError('로그인이 필요합니다');
        return;
      }

      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appliedRate: rateValue.toFixed(2),
          paybackAmount: paybackValue.toFixed(2),
        }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as Partial<SettlementDetailResponse> & {
        error?: string;
      };

      if (!response.ok) {
        setAdjustError(payload.error || '정산 정보 저장에 실패했습니다');
        return;
      }

      if (payload.data) {
        const updated = payload.data;
        setDetail((prev) => ({
          ...prev,
          appliedRate: updated.appliedRate,
          paybackAmount: updated.paybackAmount,
        }));
        setDraftRate(updated.appliedRate);
        setDraftPayback(updated.paybackAmount);
        setAdjustMessage('정산율과 페이백이 저장되었습니다');
      }
    } catch (saveError) {
      setAdjustError('정산 정보 저장 중 오류가 발생했습니다');
      console.error(saveError);
    } finally {
      setIsAdjustSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border bg-secondary">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FontAwesomeIcon
                icon={faChartBar}
                className="text-primary size-4"
              />
              정산 요약
            </CardTitle>
            <CardDescription className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span>
                정산 ID #{detail.id} · {periodLabel}
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((item) => (
              <Card key={item.label} className="border-border shadow-none">
                <CardContent className="p-4">
                  <p className="text-muted-foreground text-xs font-semibold">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            <span>병원 ID: {detail.hospitalId}</span>
            <span>생성일: {formatDate(detail.createdAt)}</span>
            <span>
              정산일: {detail.settledAt ? formatDate(detail.settledAt) : '-'}
            </span>
            {detail.isNftBoosted && (
              <Badge className="bg-primary-subtle text-primary text-[10px] font-semibold">
                NFT 가산 적용
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="text-destructive pt-6 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="text-primary size-4"
            />
            정산 상태 변경
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            정산 완료 처리 또는 대기 상태로 되돌릴 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge className="bg-primary-subtle text-primary text-[10px] font-semibold">
              {statusLabel}
            </Badge>
            <span className="text-muted-foreground text-xs">
              정산일: {detail.settledAt ? formatDate(detail.settledAt) : '-'}
            </span>
          </div>
          {statusError && (
            <div className="text-destructive text-sm">{statusError}</div>
          )}
          {statusMessage && (
            <div className="text-primary text-sm">{statusMessage}</div>
          )}
        </CardContent>
        <CardFooter className="border-border flex flex-wrap items-center gap-2 border-t px-6 py-4">
          {isSettled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleChangeStatus('PENDING_PAYMENT')}
              className="border-border text-foreground hover:bg-secondary"
              disabled={isStatusSaving}
            >
              정산 대기로 변경
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => handleChangeStatus('SETTLED')}
              disabled={isStatusSaving}
            >
              정산 완료 처리
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <FontAwesomeIcon
              icon={faMoneyBill1}
              className="text-primary size-4"
            />
            정산율/페이백 조정
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            정산율 변경 시 예상 페이백을 미리 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                정산율 (%)
              </Label>
              <Input
                value={draftRate}
                onChange={(event) => setDraftRate(event.target.value)}
                inputMode="decimal"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                페이백 금액 (원)
              </Label>
              <Input
                value={draftPayback}
                onChange={(event) => setDraftPayback(event.target.value)}
                inputMode="decimal"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                예상 페이백
              </Label>
              <div className="border-border bg-secondary flex h-10 items-center rounded-md border px-3 text-sm">
                {previewPayback === null
                  ? '-'
                  : `${formatAmount(String(previewPayback))}원`}
              </div>
            </div>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            <span>현재 정산율: {formatRate(detail.appliedRate)}%</span>
            <span>현재 페이백: {formatAmount(detail.paybackAmount)}원</span>
          </div>
          {adjustError && (
            <div className="text-destructive text-sm">{adjustError}</div>
          )}
          {adjustMessage && (
            <div className="text-primary text-sm">{adjustMessage}</div>
          )}
        </CardContent>
        <CardFooter className="border-border flex flex-wrap items-center gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyAutoPayback}
            className="border-border text-foreground hover:bg-secondary"
          >
            자동 계산
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAdjustment}
            disabled={isAdjustSaving}
          >
            {isAdjustSaving ? '저장 중...' : '저장'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FontAwesomeIcon
                icon={faBuilding}
                className="text-primary size-4"
              />
              정산 계좌 정보
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground text-xs">
            병원 정산 계좌 정보를 확인하고 수정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                은행명
              </Label>
              <Input
                value={accountBank}
                onChange={(event) => setAccountBank(event.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                계좌번호
              </Label>
              <Input
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                예금주
              </Label>
              <Input
                value={accountHolder}
                onChange={(event) => setAccountHolder(event.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            <span>병원 ID: {detail.hospitalId || '-'}</span>
          </div>
          {accountError && (
            <div className="text-destructive text-sm">{accountError}</div>
          )}
          {accountMessage && (
            <div className="text-primary text-sm">{accountMessage}</div>
          )}
        </CardContent>
        <CardFooter className="border-border flex flex-wrap items-center gap-2 border-t px-6 py-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSaveAccount}
            className="border-border text-foreground hover:bg-secondary"
            disabled={isAccountLoading}
          >
            저장하기
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <FontAwesomeIcon
              icon={faCreditCard}
              className="text-primary size-4"
            />
            결제 내역
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-secondary">
              <TableRow>
                <TableHead className="text-muted-foreground">결제 ID</TableHead>
                <TableHead className="text-muted-foreground">진료 ID</TableHead>
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
                <TableHead className="text-muted-foreground">결제일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    결제 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="border-border">
                    <TableCell>{payment.id}</TableCell>
                    <TableCell>{payment.medicalRecordId ?? '-'}</TableCell>
                    <TableCell>{payment.paymentMethod ?? '-'}</TableCell>
                    <TableCell>{payment.approveNo ?? '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(payment.amount)}원
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary-subtle text-primary text-[10px] font-semibold">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border bg-background">
        <CardHeader className="border-border bg-secondary border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <FontAwesomeIcon
              icon={faRectangleList}
              className="text-primary size-4"
            />
            이체 내역
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-secondary">
              <TableRow>
                <TableHead className="text-muted-foreground">이체 ID</TableHead>
                <TableHead className="text-muted-foreground">은행</TableHead>
                <TableHead className="text-muted-foreground">계좌</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  이체 금액
                </TableHead>
                <TableHead className="text-muted-foreground">상태</TableHead>
                <TableHead className="text-muted-foreground">이체일</TableHead>
                <TableHead className="text-muted-foreground">결과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankTransfers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    이체 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                bankTransfers.map((transfer) => (
                  <TableRow key={transfer.id} className="border-border">
                    <TableCell>{transfer.id}</TableCell>
                    <TableCell>{transfer.bankName}</TableCell>
                    <TableCell>{transfer.accountNumber}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(transfer.amount)}원
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary-subtle text-primary text-[10px] font-semibold">
                        {transfer.transferStatus ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transfer.transferredAt
                        ? formatDate(transfer.transferredAt)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {transfer.transferResult ?? '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-border justify-between border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {isLoading ? '데이터를 불러오는 중입니다' : ''}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
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
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

function parseNumber(value: string) {
  if (!value) {
    return Number.NaN;
  }
  const normalized = value.replace(/,/g, '').trim();
  return Number(normalized);
}
