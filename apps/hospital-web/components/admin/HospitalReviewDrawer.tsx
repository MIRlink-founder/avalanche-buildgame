'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Badge,
} from '@mire/ui';
import { Button } from '@mire/ui';
import { ScrollArea } from '@mire/ui';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';

export interface HospitalForDrawer {
  id: string;
  officialName: string;
  displayName: string | null;
  ceoName: string;
  businessNumber: string;
  managerPhone: string | null;
  managerEmail?: string | null;
  businessAddress?: string | null;
  createdAt: Date;
  status: string;
  registrationRequests: Array<{
    status: string;
    createdAt: Date;
  }>;
  memos?: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
}

interface HospitalReviewDrawerProps {
  hospital: HospitalForDrawer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, string> = {
  PENDING: '승인대기',
  APPROVED: '승인완료',
  ACTIVE: '승인완료',
  REJECTED: '반려',
  DISABLED: '정지',
  WITHDRAWN: '탈퇴',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DISABLED: 'bg-gray-100 text-gray-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBusinessNumber(num: string) {
  if (num.length === 10) {
    return `${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
  }
  return num;
}

function formatPhone(phone: string | null) {
  if (!phone) return '-';
  if (phone.startsWith('02')) {
    if (phone.length === 9) {
      return `${phone.slice(0, 2)}-${phone.slice(2, 5)}-${phone.slice(5)}`;
    }
    return `${phone.slice(0, 2)}-${phone.slice(2, 6)}-${phone.slice(6)}`;
  }
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

export function HospitalReviewDrawer({
  hospital,
  open,
  onOpenChange,
}: HospitalReviewDrawerProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [memo, setMemo] = useState('');

  const isPending = hospital?.registrationRequests?.[0]?.status === 'PENDING';

  const handleApprove = async () => {
    if (!hospital) return;
    setIsApproving(true);
    try {
      const res = await fetch('/api/admin/hospitals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          hospitalId: hospital.id,
          memo: memo.trim() || undefined,
        }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('hospitals-updated'));
        router.refresh();
        onOpenChange(false);
      } else {
        alert(result.error || '승인 처리에 실패했습니다.');
      }
    } catch {
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!hospital) return;
    setIsRejecting(true);
    try {
      const res = await fetch('/api/admin/hospitals/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          hospitalId: hospital.id,
          memo: memo.trim() || undefined,
        }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('hospitals-updated'));
        router.refresh();
        onOpenChange(false);
        setMemo('');
      } else {
        alert(result.error || '반려 처리에 실패했습니다.');
      }
    } catch {
      alert('반려 처리 중 오류가 발생했습니다.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-1/2 max-w-none flex-col sm:max-w-none"
        style={{ width: '50vw' }}
      >
        {hospital ? (
          <>
            <SheetHeader>
              <SheetTitle>
                {isPending ? '가입 승인 심사' : '병원 상세'}
                <Badge className={`${statusColors[hospital.status]} ml-2`}>
                  {statusLabels[hospital.status]}
                </Badge>
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1 py-6 pr-4 border-t">
              {/* 기본 정보 */}
              <section className="space-y-3">
                <h3 className="font-semibold text-foreground">병원 정보</h3>
                <dl className="grid gap-2 text-sm rounded-lg bg-muted p-4">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">병원명</dt>
                    <dd className="font-medium">
                      {hospital.displayName || hospital.officialName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">대표자</dt>
                    <dd className="font-medium">{hospital.ceoName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">사업자 번호</dt>
                    <dd className="font-mono">
                      {formatBusinessNumber(hospital.businessNumber)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">연락처</dt>
                    <dd className="font-mono">
                      {formatPhone(hospital.managerPhone)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">이메일</dt>
                    <dd>
                      {hospital.managerEmail != null &&
                        hospital.managerEmail !== '' &&
                        hospital.managerEmail}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">병원 주소</dt>
                    <dd>
                      {hospital.businessAddress != null &&
                        hospital.businessAddress !== '' &&
                        hospital.businessAddress}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">신청 일시</dt>
                    <dd>{formatDate(hospital.createdAt)}</dd>
                  </div>
                </dl>
              </section>

              {/* 첨부 서류 */}
              <section className="mt-8 space-y-4">
                <h3 className="font-semibold text-foreground">
                  제출 증빙 서류 (3종)
                </h3>
                {/* TODO: 서류 */}
                <p className="text-sm text-muted-foreground">
                  등록된 서류가 없습니다.
                </p>
              </section>

              {/* 메모 */}
              <section className="mt-8 space-y-4">
                <h3 className="font-semibold text-foreground">메모</h3>
                {isPending ? (
                  <textarea
                    className="resize-none min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none"
                    placeholder="승인/반려 사유를 입력해주세요"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                ) : (
                  <div className="space-y-3">
                    {hospital.memos?.length ? (
                      <ul className="space-y-2 text-sm">
                        {hospital.memos.map((m) => (
                          <li
                            key={m.id}
                            className="rounded-md bg-muted p-3 text-foreground"
                          >
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(m.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        등록된 메모가 없습니다.
                      </p>
                    )}
                  </div>
                )}
              </section>
            </ScrollArea>

            <SheetFooter className="flex gap-2 border-t pt-6">
              {isPending ? (
                <>
                  <Button
                    variant="outline"
                    size="xl"
                    onClick={handleReject}
                    disabled={isRejecting}
                  >
                    {isRejecting ? '처리 중...' : '반려'}
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    size="xl"
                  >
                    {isApproving ? '처리 중...' : '승인'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => onOpenChange(false)}
                >
                  닫기
                </Button>
              )}
            </SheetFooter>
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            데이터를 불러오는 중...
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
