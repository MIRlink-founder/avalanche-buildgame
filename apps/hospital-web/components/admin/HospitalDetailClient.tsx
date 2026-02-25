'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  HOSPITAL_STATUS_LABELS,
  HOSPITAL_STATUS_COLORS,
} from '@/lib/admin-hospital-format';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import type { HospitalDetail } from '@/lib/admin-hospital-types';
import { Button } from '@mire/ui';
import { Badge } from '@mire/ui';
import { ChevronRight } from 'lucide-react';
import { Tabs } from '../layout/Tabs';
import { HospitalDetailBasic } from './HospitalDetailBasic';
import { HospitalDetailAccount } from './HospitalDetailAccount';
import { HospitalDetailSettlement } from './HospitalDetailSettlement';
import { HospitalDetailAs } from './HospitalDetailAs';

export function HospitalDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string | undefined;

  const [hospital, setHospital] = useState<HospitalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const currentTab =
    (searchParams.get('detailTab') as
      | 'basic'
      | 'settlement'
      | 'account'
      | 'as') || 'basic';

  const fetchHospital = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/hospitals/${id}`, { headers: getAuthHeaders() })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('상세 조회에 실패했습니다.');
        return res.json();
      })
      .then((data: HospitalDetail | null) => {
        if (data) setHospital(data);
      })
      .catch(() => setHospital(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  const listParams = new URLSearchParams();
  const listTab = searchParams.get('tab');
  const listPage = searchParams.get('page');
  const listSearch = searchParams.get('search');
  if (listTab) listParams.set('tab', listTab);
  if (listPage && /^\d+$/.test(listPage)) listParams.set('page', listPage);
  if (listSearch) listParams.set('search', listSearch);
  const listHref = `/admin/hospitals${listParams.toString() ? `?${listParams.toString()}` : ''}`;

  if (loading || !hospital) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6 text-muted-foreground">
        {loading ? '불러오는 중...' : '병원 정보를 찾을 수 없습니다.'}
      </div>
    );
  }

  const displayName = hospital.displayName || hospital.officialName;

  const panelProps = { hospital, onRefresh: fetchHospital };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb + 목록으로 */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/admin/hospitals" className="hover:text-foreground">
            병원 관리
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={listHref} className="hover:text-foreground">
            병원 목록
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">상세 정보</span>
        </nav>
        <Button variant="outline" asChild>
          <Link href={listHref}>목록으로</Link>
        </Button>
      </div>

      {/* 병원명 + 상태 뱃지 */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <Badge className={HOSPITAL_STATUS_COLORS[hospital.status]}>
          {HOSPITAL_STATUS_LABELS[hospital.status] || hospital.status}
        </Badge>
        <Badge className="bg-gray-400 text-white hover:bg-gray-400">
          {hospital.type === 'UNIVERSITY' ? '대학병원' : '일반병원'}
        </Badge>
      </div>

      {/* 탭 (detailTab 쿼리로 관리) */}
      <Tabs
        tabs={[
          { id: 'basic', label: '기본 정보' },
          { id: 'settlement', label: '정산 관리' },
          { id: 'account', label: '계정 관리' },
          { id: 'as', label: 'AS 관리' },
        ]}
        basePath={`/admin/hospitals/${id}`}
        paramName="detailTab"
        defaultTab="basic"
        preserveParams
      />

      {currentTab === 'basic' && <HospitalDetailBasic {...panelProps} />}
      {currentTab === 'account' && <HospitalDetailAccount {...panelProps} />}
      {currentTab === 'settlement' && (
        <HospitalDetailSettlement {...panelProps} />
      )}
      {currentTab === 'as' && <HospitalDetailAs {...panelProps} />}
    </div>
  );
}
