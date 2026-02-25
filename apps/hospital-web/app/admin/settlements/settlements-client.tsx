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
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';

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

/** 금액을 ₩ 접두사 + 쉼표 형식으로 포맷 */
function formatAmount(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) return String(value);
  return `₩ ${new Intl.NumberFormat('ko-KR').format(amount)}`;
}

/** 비율을 소수점 1자리로 포맷 */
function formatRate(value: string | number): string {
  const rate = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(rate)) return String(value);
  return rate.toFixed(1);
}

/** 인증 헤더 생성 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** YYYY-MM → { year, month } */
function parseYearMonth(ym: string): { year: number; month: number } | null {
  const parts = ym.split('-');
  if (parts.length < 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

/* ------------------------------------------------------------------ */
/*  공통 숫자 페이지네이션 컴포넌트                                        */
/* ------------------------------------------------------------------ */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  /** 표시할 페이지 번호 생성 (1 2 3 ... 19 형태) */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || disabled}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Button
            key={p}
            type="button"
            variant={p === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p)}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${
              p === currentPage
                ? 'bg-gray-900 text-white hover:bg-gray-800 hover:text-white'
                : ''
            }`}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || disabled}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  정산 내역 탭 컴포넌트                                                */
/* ------------------------------------------------------------------ */

const ITEMS_PER_PAGE = 8;

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

  /* 월 목록 로드 + 전달(N-1) 자동 선택 */
  useEffect(() => {
    async function loadMonths() {
      try {
        const res = await fetch('/api/admin/settlements/months', {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data: string[] };
        const monthList = json.data ?? [];
        setMonths(monthList);

        /* 기본값: 현재 날짜 기준 전달(N-1) 자동 선택 */
        if (monthList.length > 0 && !selectedMonth) {
          const now = new Date();
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevYM = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
          const match = monthList.includes(prevYM) ? prevYM : monthList[0];
          setSelectedMonth(match);
        }
      } catch {
        /* 월 목록 실패 시 무시 */
      }
    }
    loadMonths();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const parsed = selectedMonth ? parseYearMonth(selectedMonth) : null;
  const titleLabel = parsed
    ? `${parsed.year}년 ${parsed.month}월 정산`
    : '전체 정산';
  const monthNum = parsed ? parsed.month : null;

  return (
    <div className="space-y-6">
      {/* 제목 + 월 드롭다운 (인라인) */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{titleLabel}</h2>
        <Select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-[160px]"
          aria-label="월 선택"
        >
          <option value="">전체</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {monthNum ? `${monthNum}월` : '전체'} 총 연동 매출액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatAmount(summary.totalVolume)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-muted/30">
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
              개별 설정 비율이 우선 적용 됩니다.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 달 지급 예정액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatAmount(summary.totalPayback)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              지급 대상 {summary.hospitalCount}곳
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색바 + 엑셀 다운로드 (한 줄) */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full md:w-[300px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchSettlements(1);
              }
            }}
            placeholder="병원명/계좌예금주 검색"
            className="bg-background pr-9"
            aria-label="검색"
          />
          <button
            type="button"
            onClick={() => {
              setPage(1);
              fetchSettlements(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="검색 실행"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleExport}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          <Download className="mr-1 h-4 w-4" />
          은행 이체용 엑셀 다운로드
        </Button>
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
            <TableHead>병원명</TableHead>
            <TableHead className="text-right">
              {monthNum ? `${monthNum}월 ` : ''}연동 매출액
            </TableHead>
            <TableHead className="text-center">적용 비율</TableHead>
            <TableHead className="text-right">이번 달 지급액</TableHead>
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

              return (
                <TableRow key={row.id}>
                  {/* 병원명: 2줄 (이름 + 사업자번호) */}
                  <TableCell>
                    <div>
                      <p className="font-medium">{hospitalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.hospital.businessNumber}
                      </p>
                    </div>
                  </TableCell>
                  {/* 연동 매출액: ₩ 접두사 */}
                  <TableCell className="text-right whitespace-nowrap">
                    {formatAmount(row.totalVolume)}
                  </TableCell>
                  {/* 적용 비율 */}
                  <TableCell className="text-center whitespace-nowrap">
                    {formatRate(row.appliedRate)}%
                  </TableCell>
                  {/* 지급액: ₩ 접두사 + 볼드 */}
                  <TableCell className="text-right whitespace-nowrap font-semibold">
                    {formatAmount(row.paybackAmount)}
                  </TableCell>
                  {/* 입금 계좌: 2줄 (은행/예금주 + 계좌번호) */}
                  <TableCell className="whitespace-nowrap">
                    {row.hospital.accountBank && row.hospital.accountNumber ? (
                      <div>
                        <p>
                          {row.hospital.accountBank}
                          {row.hospital.accountHolder
                            ? ` / ${row.hospital.accountHolder}`
                            : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.hospital.accountNumber}
                        </p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* 하단: 카운트 텍스트 + 숫자 페이지네이션 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? '데이터를 불러오는 중입니다'
            : total > 0
              ? `전체 ${total}개 중 ${startIndex}-${endIndex} 표시`
              : '전체 0개'}
        </p>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => fetchSettlements(p)}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  페이백 설정 탭 컴포넌트                                              */
/* ------------------------------------------------------------------ */

const PAYBACK_PER_PAGE = 6;

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
  const [hospitalPage, setHospitalPage] = useState(1);

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
            정상
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

  /* 클라이언트 사이드 페이지네이션 */
  const totalHospitalPages = Math.max(
    1,
    Math.ceil(hospitals.length / PAYBACK_PER_PAGE),
  );
  const hospitalStartIndex = (hospitalPage - 1) * PAYBACK_PER_PAGE;
  const hospitalEndIndex = Math.min(
    hospitalPage * PAYBACK_PER_PAGE,
    hospitals.length,
  );
  const visibleHospitals = hospitals.slice(hospitalStartIndex, hospitalEndIndex);

  return (
    <div className="space-y-6">
      {/* 전체 비율 설정 카드 */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>전체 페이백 비율 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <label
              htmlFor="default-payback-rate"
              className="text-sm font-medium text-foreground"
            >
              리워드 비율 (%)
            </label>
            <p className="text-sm text-muted-foreground leading-relaxed">
              설정된 비율에 따라 매월 1일 리워드가 자동 산출됩니다.
              <br />
              개별 설정 비율이 우선 적용 됩니다.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Input
              id="default-payback-rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value)}
              className="w-[160px] bg-background"
              placeholder="예: 5.0"
            />
            <span className="text-sm font-medium text-foreground">%</span>
          </div>
          <Button
            type="button"
            onClick={handleSaveRate}
            disabled={isSavingRate || !defaultRate.trim()}
            className="mt-4 bg-gray-900 text-white hover:bg-gray-800"
          >
            {isSavingRate ? '저장 중...' : '설정 저장'}
          </Button>
          {rateError && (
            <p className="mt-2 text-sm text-destructive">{rateError}</p>
          )}
          {rateSuccess && (
            <p className="mt-2 text-sm text-green-600">{rateSuccess}</p>
          )}
        </CardContent>
      </Card>

      {/* 구분선 */}
      <hr className="border-border" />

      {/* 개별 설정 병원 리스트 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">개별 설정 병원 리스트</h3>

        {hospitalsError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {hospitalsError}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>병원</TableHead>
              <TableHead>대표자명</TableHead>
              <TableHead className="text-center">적용 비율</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleHospitals.length === 0 && !isLoadingHospitals ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  개별 설정된 병원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              visibleHospitals.map((h) => {
                const hospitalName = h.displayName || h.officialName;
                return (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">
                      {hospitalName}
                    </TableCell>
                    <TableCell>{h.ceoName ?? '-'}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {formatRate(h.paybackRate)}%
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(h.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/admin/hospitals/${h.id}?detailTab=settlement`}
                        >
                          상세
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* 하단: 카운트 + 숫자 페이지네이션 */}
        {hospitals.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 {hospitals.length}개 중 {hospitalStartIndex + 1}-
              {hospitalEndIndex} 표시
            </p>
            <Pagination
              currentPage={hospitalPage}
              totalPages={totalHospitalPages}
              onPageChange={setHospitalPage}
            />
          </div>
        )}
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
