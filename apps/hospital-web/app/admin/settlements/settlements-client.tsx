'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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

type SettlementRow = {
  id: number;
  hospitalId: string;
  settlementPeriodStart: string;
  settlementPeriodEnd: string;
  totalVolume: string;
  appliedRate: string;
  paybackAmount: string;
  isNftBoosted: boolean;
  status: 'PENDING_PAYMENT' | 'SETTLED';
  settledAt: string | null;
  createdAt: string;
};

type SettlementsResponse = {
  data: SettlementRow[];
  nextCursor: number | null;
};

const STATUS_LABELS: Record<SettlementRow['status'], string> = {
  PENDING_PAYMENT: '정산 대기',
  SETTLED: '정산 완료',
};

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
  },
  {
    id: 99,
    hospitalId: 'HOS-2025-032',
    settlementPeriodStart: '2025-12-01',
    settlementPeriodEnd: '2025-12-31',
    totalVolume: '15240000',
    appliedRate: '91.20',
    paybackAmount: '13970880',
    isNftBoosted: true,
    status: 'SETTLED',
    settledAt: '2026-01-06T11:10:00.000Z',
    createdAt: '2026-01-02T09:45:00.000Z',
  },
  {
    id: 98,
    hospitalId: 'HOS-2025-007',
    settlementPeriodStart: '2025-11-01',
    settlementPeriodEnd: '2025-11-30',
    totalVolume: '7400000',
    appliedRate: '88.50',
    paybackAmount: '6549000',
    isNftBoosted: false,
    status: 'PENDING_PAYMENT',
    settledAt: null,
    createdAt: '2025-12-02T07:20:00.000Z',
  },
];

export function SettlementsClient() {
  const [hospitalId, setHospitalId] = useState('');
  const [status, setStatus] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [items, setItems] = useState<SettlementRow[]>(MOCK_SETTLEMENTS);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const payback = Number(item.paybackAmount);
        const totalVolume = Number(item.totalVolume);
        if (Number.isFinite(payback)) {
          acc.payback += payback;
        }
        if (Number.isFinite(totalVolume)) {
          acc.totalVolume += totalVolume;
        }
        if (item.status === 'PENDING_PAYMENT') {
          acc.pending += 1;
        }
        if (item.status === 'SETTLED') {
          acc.settled += 1;
        }
        return acc;
      },
      { payback: 0, totalVolume: 0, pending: 0, settled: 0 },
    );
  }, [items]);

  const summary = useMemo(() => {
    if (items.length === 0) {
      return '조회된 정산 내역이 없습니다';
    }
    return `총 ${items.length}건 · 대기 ${totals.pending}건 · 완료 ${totals.settled}건`;
  }, [items.length, totals.pending, totals.settled]);

  const fetchSettlements = async (cursor?: number | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다');
        return;
      }

      if (!hospitalId.trim()) {
        setError('병원 ID를 입력해주세요');
        return;
      }

      const params = new URLSearchParams();
      params.set('hospitalId', hospitalId.trim());
      if (status) params.set('status', status);
      if (periodFrom) params.set('periodFrom', periodFrom);
      if (periodTo) params.set('periodTo', periodTo);
      params.set('limit', '20');
      if (cursor) params.set('cursor', String(cursor));

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
        setError(payload.error || '정산 내역 조회에 실패했습니다');
        return;
      }

      const newItems = payload.data ?? [];
      setItems((prev) => (cursor ? [...prev, ...newItems] : newItems));
      setNextCursor(payload.nextCursor ?? null);
    } catch (fetchError) {
      setError('정산 내역 조회 중 오류가 발생했습니다');
      console.error(fetchError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('로그인이 필요합니다');
      return;
    }
    setItems([]);
    setNextCursor(null);
    fetchSettlements(null);
  };

  return (
    <div className="space-y-5">
      <Card className="border-border bg-secondary">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">정산 필터</CardTitle>
            <CardDescription className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span>{summary}</span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSearch}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              조회하기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                병원 ID
              </Label>
              <Input
                value={hospitalId}
                onChange={(event) => setHospitalId(event.target.value)}
                placeholder="병원 ID 입력"
                className="bg-background h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-semibold">
                정산 상태
              </Label>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
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
                className="bg-background h-10 text-sm"
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
                className="bg-background h-10 text-sm"
              />
            </div>
          </div>

          <p className="text-muted-foreground mt-4 text-xs">
            병원 ID는 운영사 계정 조회 시 필요합니다.
          </p>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs font-semibold">
                  총 정산 금액
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatAmount(String(totals.payback))}원
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs font-semibold">
                  총 거래액
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatAmount(String(totals.totalVolume))}원
                </p>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[860px]">
            <TableHeader className="bg-secondary">
              <TableRow>
                <TableHead className="text-muted-foreground">기간</TableHead>
                <TableHead className="text-muted-foreground">병원</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  총액
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  정산율
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  페이백
                </TableHead>
                <TableHead className="text-muted-foreground">상태</TableHead>
                <TableHead className="text-muted-foreground">정산일</TableHead>
                <TableHead className="text-muted-foreground text-center">
                  상세
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    조회된 정산 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell>
                      {formatPeriod(
                        item.settlementPeriodStart,
                        item.settlementPeriodEnd,
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {item.hospitalId}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(item.totalVolume)}원
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.appliedRate).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(item.paybackAmount)}원
                      {item.isNftBoosted && (
                        <Badge className="bg-primary-subtle text-primary ml-2 text-[10px] font-semibold">
                          NFT 가산
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === 'SETTLED'
                            ? 'border-primary/20 bg-primary-subtle text-primary'
                            : 'bg-secondary text-muted-foreground'
                        }
                      >
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.settledAt ? formatDate(item.settledAt) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-secondary"
                      >
                        <Link href={`/admin/settlements/${item.id}`}>
                          상세보기
                        </Link>
                      </Button>
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
          {nextCursor && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchSettlements(nextCursor)}
              className="border-border text-foreground hover:bg-secondary"
              disabled={isLoading}
            >
              더 보기
            </Button>
          )}
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
