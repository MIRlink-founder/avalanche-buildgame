'use client';

import { useState, useEffect } from 'react';
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
import {
  formatDate,
  formatBusinessNumber,
  HOSPITAL_STATUS_LABELS,
  HOSPITAL_STATUS_COLORS,
} from '@/lib/admin-hospital-format';

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
  registrationRequests?: Array<{
    createdAt: Date;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
  }>;
  memos?: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
}

interface HospitalReviewDrawerProps {
  hospitalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewHospital?: HospitalForDrawer | null;
}

export function HospitalReviewDrawer({
  hospitalId,
  open,
  onOpenChange,
  previewHospital = null,
}: HospitalReviewDrawerProps) {
  const router = useRouter();
  const [hospital, setHospital] = useState<HospitalForDrawer | null>(null);
  const [loading, setLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (!open) {
      setHospital(null);
      return;
    }
    if (previewHospital) {
      setHospital(previewHospital);
      setLoading(false);
      return;
    }
    if (!hospitalId) {
      setHospital(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setHospital(null);
    fetch(`/api/admin/hospitals/${hospitalId}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('상세 조회에 실패했습니다.');
        return res.json();
      })
      .then((data: HospitalForDrawer | null) => {
        if (!cancelled && data) {
          setHospital({
            ...data,
            createdAt: new Date(data.createdAt),
            registrationRequests: (data.registrationRequests ?? []).map(
              (r) => ({
                ...r,
                createdAt: new Date(r.createdAt),
                reviewedAt:
                  r.reviewedAt != null ? new Date(r.reviewedAt) : null,
              }),
            ),
            memos: (data.memos ?? []).map((m) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            })),
          });
        }
      })
      .catch(() => {
        if (!cancelled) setHospital(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, hospitalId]);

  const isPending = hospital?.status === 'PENDING';
  const isApprovedWaiting = hospital?.status === 'APPROVED';

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
        if (result.mailSent === false) {
          alert(
            '승인 처리되었습니다. 단, 활성화 메일 발송에 실패했습니다. 수신자 이메일과 SMTP 설정을 확인해 주세요.',
          );
        }
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
        if (result.mailSent === false) {
          alert(
            '반려 처리되었습니다. 단, 안내 메일 발송에 실패했습니다. 수신자 이메일과 SMTP 설정을 확인해 주세요.',
          );
        }
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

  const handleResendActivation = async () => {
    if (!hospital) return;
    setIsResending(true);
    try {
      const res = await fetch('/api/admin/hospitals/resend-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ hospitalId: hospital.id }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('hospitals-updated'));
        router.refresh();
        alert('활성화 메일을 재발송했습니다.');
      } else {
        alert(result.error || '재발송에 실패했습니다.');
      }
    } catch {
      alert('재발송 처리 중 오류가 발생했습니다.');
    } finally {
      setIsResending(false);
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
                <Badge
                  className={`${HOSPITAL_STATUS_COLORS[hospital.status] ?? ''} ml-2`}
                >
                  {HOSPITAL_STATUS_LABELS[hospital.status] ?? hospital.status}
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
                    <dd className="font-mono">{hospital.managerPhone}</dd>
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
                <>
                  {isApprovedWaiting && (
                    <Button
                      variant="outline"
                      size="xl"
                      onClick={handleResendActivation}
                      disabled={isResending}
                    >
                      {isResending ? '재발송 중...' : '활성화 메일 재발송'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => onOpenChange(false)}
                  >
                    닫기
                  </Button>
                </>
              )}
            </SheetFooter>
          </>
        ) : loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            데이터를 불러오는 중...
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            병원 정보를 불러올 수 없습니다.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
