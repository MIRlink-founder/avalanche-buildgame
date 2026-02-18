'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { Tabs } from '@/components/layout/Tabs';
import { StatsCards } from './StatsCards';
import { SearchBar } from './SearchBar';
import { HospitalsTable } from './HospitalsTable';
import { Pagination } from './Pagination';

interface HospitalFromApi {
  id: string;
  officialName: string;
  displayName: string | null;
  ceoName: string;
  businessNumber: string;
  managerPhone: string | null;
  createdAt: string;
  accountCreatedAt: string | null;
  status: string;
}

interface ApiResponse {
  hospitals: HospitalFromApi[];
  totalCount: number;
  totalPages: number;
  pendingCount: number;
  activeCount: number;
  newThisMonthCount: number;
  totalHospitalCount: number;
  withdrawnCount: number;
  pageSize: number;
}

export function HospitalsPageClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const page = searchParams.get('page') || '1';
  const tab = searchParams.get('tab') || 'all';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    const handler = () => setRefreshTrigger((t) => t + 1);
    window.addEventListener('hospitals-updated', handler);
    return () => window.removeEventListener('hospitals-updated', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', page);
    params.set('tab', tab);
    if (search) params.set('search', search);

    fetch(`/api/admin/hospitals?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('목록 조회에 실패했습니다.');
        return res.json();
      })
      .then((json: ApiResponse | null) => {
        if (!cancelled && json) {
          setData(json);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || '오류가 발생했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, tab, search, refreshTrigger]);

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // 첫 로딩(데이터 없음)일 때만 전체 스켈레톤
  if (!data && loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-lg bg-muted" />
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  // 데이터가 없고 로딩도 끝난 경우(에러 등) — 레이아웃만
  const safeData = data ?? {
    hospitals: [],
    totalCount: 0,
    totalPages: 0,
    pendingCount: 0,
    activeCount: 0,
    newThisMonthCount: 0,
    totalHospitalCount: 0,
    withdrawnCount: 0,
    pageSize: 10,
  };

  const hospitals = safeData.hospitals.map((h) => ({
    ...h,
    createdAt: new Date(h.createdAt),
    accountCreatedAt: h.accountCreatedAt
      ? new Date(h.accountCreatedAt)
      : null,
  }));

  return (
    <div className="space-y-6 p-6">
      {tab === 'pending' ? (
        <StatsCards
          variant="pending"
          pendingCount={safeData.pendingCount}
          activeCount={safeData.activeCount}
          newThisMonthCount={safeData.newThisMonthCount}
        />
      ) : (
        <StatsCards
          variant="overview"
          totalCount={safeData.totalHospitalCount}
          newThisMonthCount={safeData.newThisMonthCount}
          withdrawnCount={safeData.withdrawnCount}
        />
      )}

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <Tabs
          tabs={[
            { id: 'all', label: '전체' },
            { id: 'active', label: '정상' },
            { id: 'suspended', label: '정지/탈퇴' },
            { id: 'pending', label: '심사' },
          ]}
          basePath="/admin/hospitals"
          defaultTab="all"
        />
        <SearchBar />
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
            불러오는 중...
          </div>
        ) : (
          <HospitalsTable
            hospitals={hospitals}
            showAccountCreatedAt={tab !== 'pending'}
          />
        )}
        <Pagination
          currentPage={Number(page) || 1}
          totalPages={safeData.totalPages}
          totalCount={safeData.totalCount}
          pageSize={safeData.pageSize}
        />
      </div>
    </div>
  );
}
