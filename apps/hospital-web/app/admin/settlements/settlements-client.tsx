'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@mire/ui/components/badge';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
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
  hospital?: {
    id: string;
    displayName: string | null;
    officialName: string;
  } | null;
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

type SortKey =
  | 'period'
  | 'hospitalName'
  | 'totalVolume'
  | 'appliedRate'
  | 'paybackAmount'
  | 'nft'
  | 'status'
  | 'settledAt';

type SortConfig = {
  key: SortKey;
  direction: 'asc' | 'desc';
};

type HospitalSearchItem = {
  id: string;
  displayName: string | null;
  officialName: string;
};

type HospitalSearchResponse = {
  hospitals: HospitalSearchItem[];
};

const STATUS_LABELS: Record<SettlementRow['status'], string> = {
  PENDING_PAYMENT: '대기',
  SETTLED: '완료',
};

const STATUS_ORDER: Record<SettlementRow['status'], number> = {
  PENDING_PAYMENT: 0,
  SETTLED: 1,
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MOCK_SETTLEMENTS: SettlementRow[] = [
  {
    id: 101,
    hospitalId: 'HOS-2026-001',
    hospital: {
      id: 'HOS-2026-001',
      displayName: '김병원',
      officialName: '김병원',
    },
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
    hospital: {
      id: 'HOS-2026-014',
      displayName: '어쩌구병원',
      officialName: '어쩌구병원',
    },
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
    hospital: {
      id: 'HOS-2025-032',
      displayName: '멀쩡한병원',
      officialName: '멀쩡한병원',
    },
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
    hospital: {
      id: 'HOS-2025-007',
      displayName: '샘플병원',
      officialName: '샘플병원',
    },
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
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<HospitalSearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [status, setStatus] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [items, setItems] = useState<SettlementRow[]>(MOCK_SETTLEMENTS);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

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

  const deduction = useMemo(() => {
    const value = totals.totalVolume - totals.payback;
    return value > 0 ? value : 0;
  }, [totals.payback, totals.totalVolume]);

  const averageRate = useMemo(() => {
    if (totals.totalVolume <= 0) {
      return null;
    }
    return (totals.payback / totals.totalVolume) * 100;
  }, [totals.payback, totals.totalVolume]);

  const totalLabel = useMemo(() => `총 ${items.length}건`, [items.length]);

  const getHospitalLabel = (item: SettlementRow) =>
    item.hospital?.displayName ||
    item.hospital?.officialName ||
    item.hospitalId;

  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return items;
    }

    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    const toNumber = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const getValue = (item: SettlementRow) => {
      switch (sortConfig.key) {
        case 'period':
          return new Date(item.settlementPeriodStart);
        case 'hospitalName':
          return getHospitalLabel(item);
        case 'totalVolume':
          return toNumber(item.totalVolume);
        case 'appliedRate':
          return toNumber(item.appliedRate);
        case 'paybackAmount':
          return toNumber(item.paybackAmount);
        case 'nft':
          return item.isNftBoosted ? 1 : 0;
        case 'status':
          return STATUS_ORDER[item.status] ?? 99;
        case 'settledAt':
          return item.settledAt ? new Date(item.settledAt) : null;
        default:
          return null;
      }
    };

    const sorted = [...items];
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
  }, [items, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
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

    return sortConfig.direction === 'asc' ? (
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

  useEffect(() => {
    const query = hospitalId.trim();

    if (!query || UUID_PATTERN.test(query)) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSuggesting(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          tab: 'all',
          page: '1',
          search: query,
          scope: 'all',
        });
        const response = await fetch(
          `/api/admin/hospitals?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const payload = (await response
          .json()
          .catch(() => ({}))) as Partial<HospitalSearchResponse>;

        if (!response.ok || hospitalId.trim() !== query) {
          setSuggestions([]);
          return;
        }

        const hospitals = payload.hospitals ?? [];
        setSuggestions(hospitals);
        setShowSuggestions(true);
      } catch (suggestError) {
        console.error(suggestError);
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [hospitalId]);

  const fetchSettlements = async (cursor?: number | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다');
        return;
      }

      const hospitalQuery = hospitalId.trim();

      const params = new URLSearchParams();
      if (selectedHospitalId) {
        params.set('hospitalId', selectedHospitalId);
      } else if (hospitalQuery && UUID_PATTERN.test(hospitalQuery)) {
        params.set('hospitalId', hospitalQuery);
      } else if (hospitalQuery) {
        params.set('hospitalName', hospitalQuery);
      }
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
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">정산 금액</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatAmount(String(totals.payback))}원
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            차감액 {formatAmount(String(deduction))}원
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">총 거래액</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatAmount(String(totals.totalVolume))}원
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            정산율 평균 {averageRate ? averageRate.toFixed(2) : '-'}%
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">정산 리스트</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr_1fr_auto] mb-0.5">
          <div className="space-y-2">
            <span className="text-muted-foreground text-[11px] font-semibold pl-3">
              병원명
            </span>
            <div className="relative">
              <Input
                value={hospitalId}
                onChange={(event) => {
                  setHospitalId(event.target.value);
                  setSelectedHospitalId(null);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowSuggestions(false), 150);
                }}
                aria-label="병원명"
                placeholder="병원명 입력"
                className="bg-background h-10 text-base"
              />
              {showSuggestions && (
                <div className="border-border bg-background absolute left-0 top-full z-20 mt-2 w-full rounded-md border shadow-sm">
                  {isSuggesting ? (
                    <div className="text-muted-foreground px-3 py-2 text-xs">
                      검색 중...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-muted-foreground px-3 py-2 text-xs">
                      검색 결과가 없습니다.
                    </div>
                  ) : (
                    suggestions.map((hospital) => {
                      const primaryLabel =
                        hospital.displayName || hospital.officialName;
                      const secondaryLabel =
                        hospital.displayName &&
                        hospital.displayName !== hospital.officialName
                          ? hospital.officialName
                          : '';
                      return (
                        <button
                          key={hospital.id}
                          type="button"
                          className="hover:bg-secondary flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setHospitalId(primaryLabel);
                            setSelectedHospitalId(hospital.id);
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="font-medium">{primaryLabel}</span>
                          {secondaryLabel && (
                            <span className="text-muted-foreground text-xs">
                              {secondaryLabel}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground text-[11px] font-semibold pl-3">
              정산 상태
            </span>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="정산 상태"
              className="bg-background text-base"
            >
              <option value="">전체</option>
              <option value="PENDING_PAYMENT">정산 대기</option>
              <option value="SETTLED">정산 완료</option>
            </Select>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground text-[11px] font-semibold pl-3">
              정산 시작일
            </span>
            <Input
              type="date"
              value={periodFrom}
              onChange={(event) => setPeriodFrom(event.target.value)}
              aria-label="정산 시작일"
              className="bg-background h-10 text-base"
            />
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground text-[11px] font-semibold pl-3">
              정산 종료일
            </span>
            <Input
              type="date"
              value={periodTo}
              onChange={(event) => setPeriodTo(event.target.value)}
              aria-label="정산 종료일"
              className="bg-background h-10 text-base"
            />
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold opacity-0">
              조회
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handleSearch}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 text-base"
              disabled={isLoading}
            >
              조회
            </Button>
          </div>
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 rounded-lg border px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <p className="text-muted-foreground mt-3 mb-1 pl-3 text-xs">
          {totalLabel}
        </p>

        <div className="rounded-lg border">
          <Table className="min-w-[860px] text-base">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-muted-foreground h-11 text-base font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('period')}
                    className={getSortButtonClass('left')}
                  >
                    <span>기간</span>
                    {getSortIcon('period')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('hospitalName')}
                    className={getSortButtonClass('left')}
                  >
                    <span>병원명</span>
                    {getSortIcon('hospitalName')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('totalVolume')}
                    className={getSortButtonClass('right')}
                  >
                    <span>거래액</span>
                    {getSortIcon('totalVolume')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('appliedRate')}
                    className={getSortButtonClass('right')}
                  >
                    <span>정산율</span>
                    {getSortIcon('appliedRate')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('paybackAmount')}
                    className={getSortButtonClass('right')}
                  >
                    <span>정산액</span>
                    {getSortIcon('paybackAmount')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium text-center">
                  <button
                    type="button"
                    onClick={() => handleSort('nft')}
                    className={getSortButtonClass('center')}
                  >
                    <span>NFT 가산</span>
                    {getSortIcon('nft')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className={getSortButtonClass('left')}
                  >
                    <span>정상 상태</span>
                    {getSortIcon('status')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('settledAt')}
                    className={getSortButtonClass('left')}
                  >
                    <span>정산일</span>
                    {getSortIcon('settledAt')}
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground h-11 text-base font-medium text-center">
                  관리
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
                sortedItems.map((item) => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="py-3">
                      {formatPeriod(
                        item.settlementPeriodStart,
                        item.settlementPeriodEnd,
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {getHospitalLabel(item)}
                    </TableCell>
                    <TableCell className="py-3 text-right font-semibold">
                      {formatAmount(item.totalVolume)}원
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {Number(item.appliedRate).toFixed(2)}%
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {formatAmount(item.paybackAmount)}원
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      {item.isNftBoosted ? <span>적용</span> : <span>-</span>}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        className={
                          item.status === 'SETTLED'
                            ? 'bg-blue-600 text-white hover:bg-blue-600'
                            : 'bg-amber-400 text-amber-950 hover:bg-amber-400'
                        }
                      >
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      {item.settledAt ? formatDate(item.settledAt) : '-'}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-secondary rounded-full px-4"
                      >
                        <Link
                          href={`/admin/settlements/${item.id}?hospitalId=${encodeURIComponent(item.hospitalId)}`}
                        >
                          상세
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-border flex items-center justify-between border-t pt-3">
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
        </div>
      </div>
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
