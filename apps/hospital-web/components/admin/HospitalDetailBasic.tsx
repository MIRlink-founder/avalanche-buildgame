'use client';

import { useState } from 'react';
import {
  formatDate,
  formatDateOnly,
  formatBusinessNumber,
  formatFileSize,
} from '@/lib/admin-hospital-format';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import type { HospitalDetail } from '@/lib/admin-hospital-types';
import { Button } from '@mire/ui';
import { FileText, Download } from 'lucide-react';

interface HospitalDetailBasicProps {
  hospital: HospitalDetail;
  onRefresh: () => void;
}

export function HospitalDetailBasic({
  hospital,
  onRefresh,
}: HospitalDetailBasicProps) {
  const [memoText, setMemoText] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);

  const displayName = hospital.displayName || hospital.officialName;
  const isActive = hospital.status === 'ACTIVE';
  const isDisabled = hospital.status === 'DISABLED';

  const handleSaveMemo = async () => {
    if (!hospital.id || !memoText.trim() || savingMemo) return;
    setSavingMemo(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${hospital.id}/memos`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: memoText.trim() }),
      });
      if (redirectIfUnauthorized(res)) return;
      if (res.ok) {
        setMemoText('');
        onRefresh();
      } else {
        const json = await res.json();
        alert(json.error || '메모 저장에 실패했습니다.');
      }
    } finally {
      setSavingMemo(false);
    }
  };

  const handleSuspend = async () => {
    if (!hospital.id || statusActionLoading) return;
    setSuspendConfirmOpen(false);
    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${hospital.id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISABLED' }),
      });
      if (redirectIfUnauthorized(res)) return;
      if (res.ok) {
        onRefresh();
      } else {
        const json = await res.json();
        alert(json.error || '계정 정지에 실패했습니다.');
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!hospital.id || statusActionLoading) return;
    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${hospital.id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (redirectIfUnauthorized(res)) return;
      if (res.ok) {
        onRefresh();
      } else {
        const json = await res.json();
        alert(json.error || '계정 활성화에 실패했습니다.');
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  return (
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
            <dd className="mt-1 font-mono">{hospital.managerPhone}</dd>
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
