'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Clipboard,
  Copy,
  FileSpreadsheet,
  SquareArrowOutUpRight,
  SquareArrowUpRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { Label } from '@mire/ui/components/label';
import { Badge } from '@mire/ui/components/badge';
import { Pagination } from '@/components/layout/Pagination';

type WalletInfo = {
  network: string;
  walletAddress: string | null;
  maskedAddress: string | null;
  balanceFormatted: string;
  symbol: string;
};

type WalletSettings = {
  minBalanceAvax: string;
  notificationEmail: string;
};

type TxRow = {
  id: number;
  uploadedAt: string;
  hospitalName: string;
  kind: string;
  txHash: string;
  txHashShort: string;
  explorerUrl: string;
  gasUsed: string;
  status: string;
  statusValue: string;
};

type TransactionsResponse = {
  data: TxRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function formatBalance(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  }).format(n);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

export function WalletClient() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [settings, setSettings] = useState<WalletSettings>({
    minBalanceAvax: '',
    notificationEmail: '',
  });
  const [txList, setTxList] = useState<TxRow[]>([]);
  const [txTotalCount, setTxTotalCount] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const searchParams = useSearchParams();
  const txPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);

  const fetchWalletInfo = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoadingInfo(false);
      return;
    }
    setLoadingInfo(true);
    try {
      const res = await fetch('/api/admin/wallet/info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as WalletInfo;
      if (res.ok) setWalletInfo(data);
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoadingSettings(false);
      return;
    }
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/wallet/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as WalletSettings;
      if (res.ok) setSettings(data);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number) => {
    const token = getAccessToken();
    if (!token) {
      setLoadingTx(false);
      return;
    }
    setLoadingTx(true);
    try {
      const res = await fetch(
        `/api/admin/wallet/transactions?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = (await res.json()) as TransactionsResponse;
      if (res.ok) {
        setTxList(data.data);
        setTxTotalCount(data.totalCount);
        setTxTotalPages(data.totalPages);
      }
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletInfo();
    fetchSettings();
  }, [fetchWalletInfo, fetchSettings]);

  useEffect(() => {
    fetchTransactions(txPage);
  }, [txPage, fetchTransactions]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!copyDone) return;
    const t = setTimeout(() => setCopyDone(false), 1500);
    return () => clearTimeout(t);
  }, [copyDone]);

  const handleCopyAddress = async () => {
    const full = walletInfo?.walletAddress;
    if (!full) return;
    try {
      await navigator.clipboard.writeText(full);
      setCopyDone(true);
      setToastMessage('주소가 복사되었습니다.');
    } catch {
      setToastMessage('복사에 실패했습니다.');
    }
  };

  const handleSaveSettings = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/wallet/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          minBalanceAvax: settings.minBalanceAvax,
          notificationEmail: settings.notificationEmail,
        }),
      });
      if (res.ok) {
        setToastMessage('이메일이 설정되었습니다.');
      } else {
        const err = (await res.json()) as { error?: string };
        setToastMessage(err?.error ?? '설정 저장에 실패했습니다.');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleMinBalanceChange = (value: string) => {
    const digits = value.replace(/[^0-9.]/g, '');
    setSettings((s) => ({ ...s, minBalanceAvax: digits }));
  };

  const handleExcelDownload = () => {
    const headers = [
      '일시',
      '병원명',
      '구분',
      'TXID (HASH)',
      '소모 가스비',
      '상태',
    ];
    const rows = txList.map((tx) => [
      formatDateTime(tx.uploadedAt),
      tx.hospitalName,
      tx.kind,
      tx.txHash,
      tx.gasUsed,
      tx.status,
    ]);
    const BOM = '\uFEFF';
    const csv =
      BOM +
      [
        headers.join(','),
        ...rows.map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
        ),
      ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `트랜잭션_이력_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {toastMessage && (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="flex gap-6">
        {/* 지갑 연결 정보 */}
        <Card className="w-1/2">
          <CardHeader>
            <CardTitle>지갑 연결 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInfo ? (
              <p className="text-muted-foreground text-sm">불러오는 중...</p>
            ) : walletInfo ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-muted-foreground">네트워크</p>
                  <p className="font-medium">{walletInfo.network}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">지갑 주소</p>
                  <span className="font-mono text-sm">
                    {walletInfo.maskedAddress ?? '-'}
                  </span>
                  {walletInfo.walletAddress && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleCopyAddress}
                      title="주소 복사"
                    >
                      <Copy className="h-4 w-4" />
                      {copyDone && <span className="sr-only">복사됨</span>}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                지갑 주소가 설정되지 않았습니다. MASTER_WALLET_ADDRESS
                환경변수를 확인하세요.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 현재 보유 잔액 */}
        <Card className="w-1/2">
          <CardHeader>
            <CardTitle>현재 보유 잔액</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInfo ? (
              <p className="text-muted-foreground text-sm">불러오는 중...</p>
            ) : walletInfo ? (
              <p className="text-xl">
                {formatBalance(walletInfo.balanceFormatted)} {walletInfo.symbol}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 알림 임계치 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 임계치 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {loadingSettings ? (
            <p className="text-muted-foreground text-sm">불러오는 중...</p>
          ) : (
            <>
              <div className="flex gap-12 w-full">
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="minBalance">최소 잔액 알림 기준</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="minBalance"
                      type="text"
                      inputMode="decimal"
                      value={settings.minBalanceAvax}
                      onChange={(e) => handleMinBalanceChange(e.target.value)}
                    />
                    <span className="text-muted-foreground text-sm">
                      {walletInfo?.symbol ?? 'AVAX'}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    잔액이 이 값보다 낮아지면 알림을 발송합니다.
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="notificationEmail">알림 수신 이메일</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        notificationEmail: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="xl"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? '저장 중...' : '설정 저장'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 트랜잭션 소모 이력 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30">
          <CardTitle>트랜잭션 소모 이력</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExcelDownload}
            disabled={txList.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            엑셀 다운로드
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* 
              [폭 균일화]
              각 열의 너비를 거의 동일하게 맞추고(약 1/6씩), 일부 단어 길이에 맞는 최소 폭만 부여.
              table-layout: fixed를 사용하므로, min-w-0으로 오버플로우되는 내용을 정리하여
              가독성과 라인 정렬을 개선합니다.
            */}
            <table className="w-full min-w-[720px] table-fixed">
              <colgroup>
                <col style={{ width: '16.66%' }} />
                <col style={{ width: '16.66%' }} />
                <col style={{ width: '16.66%' }} />
                <col style={{ width: '16.66%' }} />
                <col style={{ width: '16.66%' }} />
                <col style={{ width: '16.66%' }} />
              </colgroup>
              <thead className="bg-muted/50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-muted-foreground font-medium">
                    일시
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-muted-foreground font-medium">
                    병원명
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-muted-foreground font-medium">
                    구분
                  </th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                    TXID (HASH)
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground font-medium">
                    소모 가스비
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-muted-foreground font-medium">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingTx ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      불러오는 중...
                    </td>
                  </tr>
                ) : txList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      트랜잭션 이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  txList.map((tx) => (
                    <tr key={tx.id}>
                      <td className="whitespace-nowrap px-4 py-3 min-w-0 overflow-hidden text-ellipsis">
                        {formatDateTime(tx.uploadedAt)}
                      </td>
                      <td className="px-4 py-3 min-w-0 overflow-hidden text-ellipsis">
                        {tx.hospitalName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 min-w-0">
                        {tx.kind}
                      </td>
                      <td className="px-4 py-3 min-w-0 overflow-hidden text-ellipsis">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-1 items-center font-mono text-primary hover:underline"
                        >
                          {tx.txHashShort}
                          <SquareArrowOutUpRight className="h-4 w-4" />
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right min-w-0">
                        {tx.gasUsed}
                      </td>
                      <td className="px-4 py-3 min-w-0">
                        <Badge
                          variant={
                            tx.statusValue === 'CONFIRMED'
                              ? 'default'
                              : 'destructive'
                          }
                          className={
                            tx.statusValue === 'CONFIRMED'
                              ? 'bg-success'
                              : 'bg-destructive'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3">
            <Pagination
              currentPage={txPage}
              totalPages={txTotalPages}
              totalCount={txTotalCount}
              pageSize={10}
              basePath="/admin/wallet"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
