'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/layout/Tabs';
import { Badge } from '@mire/ui/components/badge';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SettlementRow = {
  id: number;
  publicId?: string;
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
    publicId: '2f6fb07c-2f5e-4c55-9be3-1d22d3f4d8e2',
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
    publicId: '6c7c9a0e-3e1b-4d73-9bdf-8e4b6a3b1a70',
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
    publicId: 'a85f5d7b-8e54-4f89-9df1-2d746f6e0e9e',
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
    publicId: 'c314a2b1-9c86-4a6d-8b69-5b3b4b2e9f77',
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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';
  const [hospitalId, setHospitalId] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<HospitalSearchItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [items, setItems] = useState<SettlementRow[]>(MOCK_SETTLEMENTS);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const statusFilter = useMemo(() => {
    if (currentTab === 'settled') {
      return 'SETTLED';
    }
    if (currentTab === 'pending') {
      return 'PENDING_PAYMENT';
    }
    return '';
  }, [currentTab]);

  const filteredItems = useMemo(() => {
    if (!statusFilter) {
      return items;
    }
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const summaryTotals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const payback = Number(item.paybackAmount);
        if (Number.isFinite(payback)) {
          acc.total += payback;
          if (item.status === 'SETTLED') {
            acc.settled += payback;
          }
          if (item.status === 'PENDING_PAYMENT') {
            acc.pending += payback;
          }
        }
        return acc;
      },
      { total: 0, settled: 0, pending: 0 },
    );
  }, [items]);

  const totalLabel = useMemo(() => {
    if (filteredItems.length === 0) {
      return '총 0건 표시';
    }
    return `총 ${filteredItems.length}개 중 1-${filteredItems.length} 표시`;
  }, [filteredItems.length]);

  const getHospitalLabel = (item: SettlementRow) =>
    item.hospital?.displayName ||
    item.hospital?.officialName ||
    item.hospitalId;

  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return filteredItems;
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

    const sorted = [...filteredItems];
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
  }, [filteredItems, sortConfig]);

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
      if (periodFrom) params.set('periodFrom', periodFrom);
      if (periodTo) params.set('periodTo', periodTo);
      params.set('limit', '10');
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
      setItems(newItems);
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
    setPageIndex(1);
    setCursorStack([null]);
    setItems([]);
    setNextCursor(null);
    fetchSettlements(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }
    setPageIndex(1);
    setCursorStack([null]);
    setItems([]);
    setNextCursor(null);
    fetchSettlements(null);
  }, []);

  const handlePrevPage = () => {
    if (pageIndex === 1 || isLoading) {
      return;
    }
    const prevCursor = cursorStack[pageIndex - 2] ?? null;
    setPageIndex((prev) => Math.max(prev - 1, 1));
    setCursorStack((prev) => prev.slice(0, -1));
    fetchSettlements(prevCursor);
  };

  const handleNextPage = () => {
    if (!nextCursor || isLoading) {
      return;
    }
    setPageIndex((prev) => prev + 1);
    setCursorStack((prev) => [...prev, nextCursor]);
    fetchSettlements(nextCursor);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">전체 금액</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatAmount(String(summaryTotals.total))}원
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">정산 완료 금액</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatAmount(String(summaryTotals.settled))}원
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">정산 대기 금액</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatAmount(String(summaryTotals.pending))}원
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <Tabs
          tabs={[
            { id: 'all', label: '전체' },
            { id: 'settled', label: '정산 완료' },
            { id: 'pending', label: '정산 대기' },
          ]}
          basePath="/admin/settlements"
          defaultTab="all"
        />

        <div className="max-w-[980px]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full md:w-[360px]">
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
                  placeholder="병원명을 입력해주세요"
                  className="bg-background"
                />
                {showSuggestions && (
                  <div className="border-border bg-background absolute left-0 top-full z-20 mt-0 w-full rounded-md border shadow-sm">
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
            <div className="w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={periodFrom}
                  onChange={(event) => setPeriodFrom(event.target.value)}
                  aria-label="정산 시작일"
                  className="bg-background w-full md:w-[200px]"
                />
                <span className="text-muted-foreground text-xs">~</span>
                <Input
                  type="date"
                  value={periodTo}
                  onChange={(event) => setPeriodTo(event.target.value)}
                  aria-label="정산 종료일"
                  className="bg-background w-full md:w-[200px]"
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Button
                type="button"
                size="xl"
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                조회
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 rounded-lg border px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] table-fixed">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[180px] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('period')}
                      className={getSortButtonClass('left')}
                    >
                      <span>기간</span>
                      {getSortIcon('period')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[150px]">
                    <button
                      type="button"
                      onClick={() => handleSort('hospitalName')}
                      className={getSortButtonClass('left')}
                    >
                      <span>병원명</span>
                      {getSortIcon('hospitalName')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-[140px]">
                    <button
                      type="button"
                      onClick={() => handleSort('paybackAmount')}
                      className={getSortButtonClass('right')}
                    >
                      <span>페이백</span>
                      {getSortIcon('paybackAmount')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[110px] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className={getSortButtonClass('left')}
                    >
                      <span>정산 상태</span>
                      {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[110px] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('settledAt')}
                      className={getSortButtonClass('left')}
                    >
                      <span>정산일</span>
                      {getSortIcon('settledAt')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-[90px]">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.length === 0 && !isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      조회된 정산 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatPeriod(
                          item.settlementPeriodStart,
                          item.settlementPeriodEnd,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block max-w-[150px] truncate">
                          {getHospitalLabel(item)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {formatAmount(item.paybackAmount)}원
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            item.status === 'SETTLED'
                              ? 'bg-blue-600 text-white hover:bg-blue-600'
                              : 'bg-amber-400 text-amber-950 hover:bg-amber-400'
                          }
                        >
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.settledAt ? formatDate(item.settledAt) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/admin/settlements/${item.publicId ?? item.id}`}
                          >
                            상세
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex min-h-10 items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {isLoading ? '데이터를 불러오는 중입니다' : totalLabel}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={pageIndex === 1 || isLoading}
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
              {pageIndex}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!nextCursor || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
