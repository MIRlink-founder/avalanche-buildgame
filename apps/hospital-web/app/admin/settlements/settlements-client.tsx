'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs } from '@/components/layout/Tabs';
import { Badge } from '@mire/ui/components/badge';
import { Button } from '@mire/ui/components/button';
import { Input } from '@mire/ui/components/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mire/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mire/ui/components/table';
import { Select } from '@mire/ui/components/select';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  타입 정의                                                          */
/* ------------------------------------------------------------------ */

interface SettlementHospital {
  id: string;
  displayName: string | null;
  officialName: string;
  businessNumber: string;
  accountBank: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
}

interface SettlementRow {
  id: number;
  publicId: string;
  hospitalId: string;
  settlementPeriodStart: string;
  settlementPeriodEnd: string;
  totalVolume: string;
  caseCount: number;
  appliedRate: string;
  paybackAmount: string;
  status: string;
  hospital: SettlementHospital;
}

interface SettlementSummary {
  totalVolume: number;
  avgRate: number;
  totalPayback: number;
  hospitalCount: number;
}

interface SettlementsResponse {
  data: SettlementRow[];
  total: number;
  page: number;
  limit: number;
  summary: SettlementSummary;
}

interface PaybackSettingRow {
  id: string;
  displayName: string | null;
  officialName: string;
  ceoName: string | null;
  paybackRate: string;
  paybackRateUpdatedAt: string | null;
  status: string;
}

interface SystemConfigResponse {
  data: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  유틸리티 함수                                                       */
/* ------------------------------------------------------------------ */

/** 금액을 한국어 쉼표 형식으로 포맷 */
function formatAmount(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat('ko-KR').format(amount);
}

/** 비율을 소수점 2자리로 포맷 */
function formatRate(value: string | number): string {
  const rate = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(rate)) return String(value);
  return rate.toFixed(2);
}

/** 인증 헤더 생성 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 월(YYYY-MM) 형식에서 N월 추출 */
function extractMonthLabel(month: string): string {
  const parts = month.split('-');
  if (parts.length < 2) return month;
  const m = Number(parts[1]);
  return Number.isFinite(m) ? `${m}월` : month;
}

/* ------------------------------------------------------------------ */
/*  정산 내역 탭 컴포넌트                                                */
/* ------------------------------------------------------------------ */

const ITEMS_PER_PAGE = 20;

function SettlementListTab() {
  /* 월 드롭다운 데이터 */
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  /* 검색 */
  const [search, setSearch] = useState('');

  /* 정산 데이터 */
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [summary, setSummary] = useState<SettlementSummary>({
    totalVolume: 0,
    avgRate: 0,
    totalPayback: 0,
    hospitalCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* 월 목록 로드 */
  useEffect(() => {
    async function loadMonths() {
      try {
        const res = await fetch('/api/admin/settlements/months', {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data: string[] };
        setMonths(json.data ?? []);
      } catch {
        /* 월 목록 실패 시 무시 */
      }
    }
    loadMonths();
  }, []);

  /* 정산 내역 로드 */
  const fetchSettlements = useCallback(
    async (pageNum: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedMonth) params.set('month', selectedMonth);
        if (search.trim()) params.set('search', search.trim());
        params.set('page', String(pageNum));
        params.set('limit', String(ITEMS_PER_PAGE));

        const res = await fetch(
          `/api/settlements?${params.toString()}`,
          { headers: getAuthHeaders() },
        );

        const json = (await res.json().catch(() => ({}))) as Partial<
          SettlementsResponse & { error?: string }
        >;

        if (!res.ok) {
          setError(json.error ?? '정산 내역 조회에 실패했습니다');
          return;
        }

        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
        setPage(json.page ?? pageNum);
        if (json.summary) setSummary(json.summary);
      } catch {
        setError('정산 내역 조회 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    },
    [selectedMonth, search],
  );

  /* 초기 로드 및 월 변경 시 재조회 */
  useEffect(() => {
    fetchSettlements(1);
  }, [fetchSettlements]);

  /* 검색 실행 */
  const handleSearch = () => {
    setPage(1);
    fetchSettlements(1);
  };

  /* 엑셀 다운로드 */
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.set('month', selectedMonth);

      const res = await fetch(
        `/api/admin/settlements/export?${params.toString()}`,
        { headers: getAuthHeaders() },
      );

      if (!res.ok) {
        setError('엑셀 다운로드에 실패했습니다');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `은행이체용_정산내역_${selectedMonth || '전체'}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setError('엑셀 다운로드 중 오류가 발생했습니다');
    }
  };

  /* 페이지네이션 계산 */
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const startIndex = (page - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(page * ITEMS_PER_PAGE, total);

  /* 월 라벨 */
  const monthLabel = selectedMonth
    ? extractMonthLabel(selectedMonth)
    : '전체';

  return (
    <div className="space-y-6">
      {/* 필터 영역 */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full md:w-[200px]"
          aria-label="월 선택"
        >
          <option value="">전체</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder="병원명 / 계좌 예금주 검색"
          className="w-full bg-background md:w-[300px]"
          aria-label="검색"
        />

        <Button type="button" onClick={handleSearch} disabled={isLoading}>
          조회
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {monthLabel} 총 연동 매출액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatAmount(summary.totalVolume)}원
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 페이백 비율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatRate(summary.avgRate)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              개별 설정 비율이 우선 적용
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 달 지급 예정액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatAmount(summary.totalPayback)}원
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              지급 대상 {summary.hospitalCount}곳
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>병원명 (사업자번호)</TableHead>
            <TableHead className="text-right">연동 매출액</TableHead>
            <TableHead className="text-right">적용 비율(%)</TableHead>
            <TableHead className="text-right">지급액</TableHead>
            <TableHead>입금 계좌</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && !isLoading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                조회된 정산 내역이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const hospitalName =
                row.hospital.displayName || row.hospital.officialName;
              const accountInfo =
                row.hospital.accountBank && row.hospital.accountNumber
                  ? `${row.hospital.accountBank} ${row.hospital.accountNumber}`
                  : '-';

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{hospitalName}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({row.hospital.businessNumber})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatAmount(row.totalVolume)}원
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatRate(row.appliedRate)}%
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatAmount(row.paybackAmount)}원
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {accountInfo}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* 하단: 엑셀 다운로드 + 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-1 h-4 w-4" />
            은행 이체용 엑셀 다운로드
          </Button>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? '데이터를 불러오는 중입니다'
              : total > 0
                ? `총 ${total}건 중 ${startIndex}-${endIndex} 표시`
                : '총 0건'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchSettlements(page - 1)}
            disabled={page <= 1 || isLoading}
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
            {page}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchSettlements(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  페이백 설정 탭 컴포넌트                                              */
/* ------------------------------------------------------------------ */

function PaybackSettingsTab() {
  /* 전체 비율 설정 */
  const [defaultRate, setDefaultRate] = useState('');
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateSuccess, setRateSuccess] = useState<string | null>(null);

  /* 개별 설정 병원 리스트 */
  const [hospitals, setHospitals] = useState<PaybackSettingRow[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);

  /* 전체 비율 로드 */
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin/system-config', {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const json = (await res.json()) as SystemConfigResponse;
        const rate = json.data?.DEFAULT_PAYBACK_RATE;
        if (rate) setDefaultRate(rate);
      } catch {
        /* 로드 실패 시 무시 */
      }
    }
    loadConfig();
  }, []);

  /* 전체 비율 저장 */
  const handleSaveRate = async () => {
    setIsSavingRate(true);
    setRateError(null);
    setRateSuccess(null);

    try {
      const res = await fetch('/api/admin/system-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ DEFAULT_PAYBACK_RATE: defaultRate }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setRateError(json.error ?? '저장에 실패했습니다');
        return;
      }

      setRateSuccess('저장되었습니다');
      setTimeout(() => setRateSuccess(null), 3000);
    } catch {
      setRateError('저장 중 오류가 발생했습니다');
    } finally {
      setIsSavingRate(false);
    }
  };

  /* 개별 설정 병원 리스트 로드 */
  useEffect(() => {
    async function loadHospitals() {
      setIsLoadingHospitals(true);
      setHospitalsError(null);

      try {
        const res = await fetch('/api/admin/settlements/payback-settings', {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          setHospitalsError('개별 설정 목록을 불러오는 데 실패했습니다');
          return;
        }

        const json = (await res.json()) as { data: PaybackSettingRow[] };
        setHospitals(json.data ?? []);
      } catch {
        setHospitalsError('개별 설정 목록 조회 중 오류가 발생했습니다');
      } finally {
        setIsLoadingHospitals(false);
      }
    }
    loadHospitals();
  }, []);

  /** 상태 뱃지 스타일 */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-600">
            활성
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400">
            대기
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge className="bg-red-600 text-white hover:bg-red-600">
            정지
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-400 text-white hover:bg-gray-400">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 전체 비율 설정 카드 */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>전체 리워드 비율 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="w-[200px]">
              <label
                htmlFor="default-payback-rate"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                리워드 비율 (%)
              </label>
              <Input
                id="default-payback-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="bg-background"
                placeholder="예: 5.00"
              />
            </div>
            <Button
              type="button"
              onClick={handleSaveRate}
              disabled={isSavingRate || !defaultRate.trim()}
            >
              {isSavingRate ? '저장 중...' : '저장'}
            </Button>
          </div>
          {rateError && (
            <p className="mt-2 text-sm text-destructive">{rateError}</p>
          )}
          {rateSuccess && (
            <p className="mt-2 text-sm text-green-600">{rateSuccess}</p>
          )}
        </CardContent>
      </Card>

      {/* 개별 설정 병원 리스트 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">개별 설정 병원</h3>

        {hospitalsError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {hospitalsError}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>병원명</TableHead>
              <TableHead>대표자명</TableHead>
              <TableHead className="text-right">적용 비율(%)</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hospitals.length === 0 && !isLoadingHospitals ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  개별 설정된 병원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              hospitals.map((h) => {
                const hospitalName = h.displayName || h.officialName;
                return (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">
                      {hospitalName}
                    </TableCell>
                    <TableCell>{h.ceoName ?? '-'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatRate(h.paybackRate)}%
                    </TableCell>
                    <TableCell>{getStatusBadge(h.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/admin/hospitals/${h.id}?detailTab=settlement`}
                        >
                          관리
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  메인 컴포넌트                                                       */
/* ------------------------------------------------------------------ */

export function SettlementsClient() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'history';

  return (
    <div className="space-y-6 p-6">
      <Tabs
        tabs={[
          { id: 'history', label: '정산 내역' },
          { id: 'payback', label: '페이백 설정' },
        ]}
        basePath="/admin/settlements"
        paramName="tab"
        defaultTab="history"
      />

      {currentTab === 'payback' ? (
        <PaybackSettingsTab />
      ) : (
        <SettlementListTab />
      )}
    </div>
  );
}
