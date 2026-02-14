'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { StatsCards } from './StatsCards';
import { HospitalTabs } from './HospitalTabs';
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
  status: string;
  registrationRequests: Array<{
    status: string;
    createdAt: string;
  }>;
  memos?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

interface ApiResponse {
  hospitals: HospitalFromApi[];
  totalCount: number;
  totalPages: number;
  pendingCount: number;
  activeCount: number;
  newThisMonthCount: number;
  pageSize: number;
}

export function HospitalsPageClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const page = searchParams.get('page') || '1';
  const tab = searchParams.get('tab') || 'pending';
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

  if (loading || !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-lg bg-muted" />
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  // API에서 받은 날짜 문자열을 Date로 변환 (테이블/드로어 호환)
  const hospitals = data.hospitals.map((h) => ({
    ...h,
    createdAt: new Date(h.createdAt),
    registrationRequests: h.registrationRequests.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
    })),
    memos: (h.memos ?? []).map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    })),
  }));

  return (
    <div className="space-y-6 p-6">
      <StatsCards
        pendingCount={data.pendingCount}
        activeCount={data.activeCount}
        newThisMonthCount={data.newThisMonthCount}
      />

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <HospitalTabs />
        <SearchBar />
        <HospitalsTable hospitals={hospitals} />
        <Pagination
          currentPage={Number(page) || 1}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
        />
      </div>
    </div>
  );
}
