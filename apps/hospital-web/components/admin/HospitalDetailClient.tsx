'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  formatDate,
  formatBusinessNumber,
  formatPhone,
  HOSPITAL_STATUS_LABELS,
  HOSPITAL_STATUS_COLORS,
} from '@/lib/admin-hospital-format';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { Button } from '@mire/ui';
import { Badge } from '@mire/ui';
import { ChevronRight, FileText, Download } from 'lucide-react';
import { Tabs } from '../layout/Tabs';

interface HospitalDocument {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
}

interface HospitalMemo {
  id: string;
  content: string;
  createdAt: string;
}

interface HospitalDetail {
  id: string;
  officialName: string;
  displayName: string | null;
  ceoName: string;
  businessNumber: string;
  managerPhone: string | null;
  managerEmail: string | null;
  businessAddress: string | null;
  createdAt: string;
  accountCreatedAt: string | null;
  withdrawalDate: string | null;
  status: string;
  documents: HospitalDocument[];
  memos: HospitalMemo[];
}

function formatDateOnly(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '';
  if (bytes >= 1024 * 1024) return `(${(bytes / (1024 * 1024)).toFixed(1)}MB)`;
  if (bytes >= 1024) return `(${(bytes / 1024).toFixed(1)}KB)`;
  return `(${bytes}B)`;
}

export function HospitalDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string | undefined;

  const [hospital, setHospital] = useState<HospitalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoText, setMemoText] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);

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
  // page는 숫자일 때만 포함 (꼬인 값 예: 1/?detailTab=basics 방지)
  if (listPage && /^\d+$/.test(listPage)) listParams.set('page', listPage);
  if (listSearch) listParams.set('search', listSearch);
  const listHref = `/admin/hospitals${listParams.toString() ? `?${listParams.toString()}` : ''}`;

  const handleSaveMemo = async () => {
    if (!id || !memoText.trim() || savingMemo) return;
    setSavingMemo(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${id}/memos`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: memoText.trim() }),
      });
      if (redirectIfUnauthorized(res)) return;
      if (res.ok) {
        setMemoText('');
        fetchHospital();
      } else {
        const json = await res.json();
        alert(json.error || '메모 저장에 실패했습니다.');
      }
    } finally {
      setSavingMemo(false);
    }
  };

  const handleSuspend = async () => {
    if (!id || statusActionLoading) return;
    setSuspendConfirmOpen(false);
    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISABLED' }),
      });
      if (redirectIfUnauthorized(res)) return;
      if (res.ok) {
        fetchHospital();
      } else {
        const json = await res.json();
        alert(json.error || '계정 정지에 실패했습니다.');
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!id || statusActionLoading) return;
    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (redirectIfUnauthorized(res)) return;
      if (res.ok) {
        fetchHospital();
      } else {
        const json = await res.json();
        alert(json.error || '계정 활성화에 실패했습니다.');
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  if (loading || !hospital) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6 text-muted-foreground">
        {loading ? '불러오는 중...' : '병원 정보를 찾을 수 없습니다.'}
      </div>
    );
  }

  const displayName = hospital.displayName || hospital.officialName;
  const isActive = hospital.status === 'ACTIVE';
  const isDisabled = hospital.status === 'DISABLED';

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb + 목록으로 */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/admin/hospitals" className="hover:text-foreground">
            병원 관리
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/admin/hospitals" className="hover:text-foreground">
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
      </div>

      {/* 탭 (detailTab 쿼리로 관리, 목록용 tab/page/search는 유지) */}
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

      {currentTab === 'basic' && (
        <div className="space-y-8">
          {/* 병원 정보 (읽기 전용) */}
          <div className="rounded-lg border bg-card p-6">
            <dl className="grid gap-2">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">병원명</dt>
                <dd className="mt-1 font-medium">{displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">대표자</dt>
                <dd className="mt-1 font-medium">{hospital.ceoName || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">사업자번호</dt>
                <dd className="mt-1 font-mono">
                  {formatBusinessNumber(hospital.businessNumber)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">연락처</dt>
                <dd className="mt-1 font-mono">
                  {formatPhone(hospital.managerPhone)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">이메일</dt>
                <dd className="mt-1 font-mono">{hospital.managerEmail}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">병원 주소</dt>
                <dd className="mt-1">{hospital.businessAddress || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">계정 생성일</dt>
                <dd className="mt-1">
                  {hospital.accountCreatedAt
                    ? formatDateOnly(hospital.accountCreatedAt)
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">계정 탈퇴일</dt>
                <dd className="mt-1">
                  {hospital.withdrawalDate
                    ? formatDateOnly(hospital.withdrawalDate)
                    : '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* 제출 증빙 서류 */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-foreground">
              제출 증빙 서류 ({hospital.documents?.length ?? 0}종)
            </h3>
            {hospital.documents?.length ? (
              <ul className="mt-4 space-y-3">
                {hospital.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {doc.fileName} {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.fileName}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        다운로드
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">파일 없음</p>
            )}
          </div>

          {/* 메모 */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-foreground">메모</h3>
            {hospital.memos?.length > 0 && (
              <ul className="mt-4 space-y-2">
                {hospital.memos.map((m) => (
                  <li key={m.id} className="rounded-md bg-muted/50 p-3 text-sm">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(new Date(m.createdAt))}{' '}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-2">
              <textarea
                className="min-h-[100px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="메모를 입력하세요"
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveMemo}
                  disabled={!memoText.trim() || savingMemo}
                >
                  {savingMemo ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </div>

          {/* 계정 정지 / 계정 활성화 */}
          <div className="flex justify-end">
            {isActive && (
              <Button
                variant="destructive"
                onClick={() => setSuspendConfirmOpen(true)}
                disabled={statusActionLoading}
              >
                계정 정지
              </Button>
            )}
            {isDisabled && (
              <Button onClick={handleActivate} disabled={statusActionLoading}>
                {statusActionLoading ? '처리 중...' : '계정 활성화'}
              </Button>
            )}
          </div>
        </div>
      )}

      {currentTab !== 'basic' && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          준비 중입니다.
        </div>
      )}

      {/* 계정 정지 확인 Alert */}
      {suspendConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suspend-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg">
            <h2 id="suspend-title" className="text-lg font-semibold">
              계정 정지
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              해당 계정을 정지 시키겠습니까?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSuspendConfirmOpen(false)}
              >
                닫기
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={statusActionLoading}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
