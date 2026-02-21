'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Badge } from '@mire/ui';
import { Button } from '@mire/ui';
import { Input } from '@mire/ui';
import { Label } from '@mire/ui';
import { Select } from '@mire/ui';
import { ChevronRight } from 'lucide-react';
import {
  ACCOUNT_ROLE_LABELS,
  ACCOUNT_STATUS_LABELS,
  USER_ROLE_COLORS,
  USER_STATUS_COLORS,
} from '@/lib/admin-hospital-format';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { getPayloadFromToken } from '@/lib/decode-token';

const ROLE_OPTIONS = [
  { value: 'MASTER_ADMIN', label: '관리자' },
  { value: 'DEPT_ADMIN', label: '일반' },
];

interface HospitalUserDetail {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  departmentName: string | null;
  statusChangedAt: string | null;
  createdAt: string;
  lastAccessAt: string | null;
}

interface StaffDetailResponse {
  user: HospitalUserDetail;
}

export function HospitalStaffDetailPanel() {
  const params = useParams();
  const searchParams = useSearchParams();
  const staffId = params?.id as string | undefined;

  const [staff, setStaff] = useState<HospitalUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('DEPT_ADMIN');
  const [formError, setFormError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const payload = token ? getPayloadFromToken(token) : null;
    setCurrentUserEmail(payload?.email ?? '');
    setCurrentUserRole(payload?.role ?? '');
  }, []);

  useEffect(() => {
    if (!staffId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/hospitals/staff/${staffId}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('직원 정보를 불러오지 못했습니다.');
        return res.json();
      })
      .then((data: StaffDetailResponse | null) => {
        if (!cancelled && data?.user) {
          setStaff(data.user);
          setFormName(data.user.name);
          setFormRole(data.user.role);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || '직원 정보를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [staffId]);

  const listHref = useMemo(() => {
    const listParams = new URLSearchParams();
    const listTab = searchParams.get('tab');
    const listPage = searchParams.get('page');
    const listSearch = searchParams.get('search');
    if (listTab) listParams.set('tab', listTab);
    if (listPage && /^\d+$/.test(listPage)) listParams.set('page', listPage);
    if (listSearch) listParams.set('search', listSearch);
    const query = listParams.toString();
    return `/hospital/staff${query ? `?${query}` : ''}`;
  }, [searchParams]);

  if (loading || !staff) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6 text-muted-foreground">
        {loading ? '불러오는 중...' : '직원 정보를 찾을 수 없습니다.'}
      </div>
    );
  }

  const canManage = currentUserRole === 'MASTER_ADMIN';
  const isSelf = staff.email === currentUserEmail && currentUserEmail !== '';
  const isPending = staff.status === 'PENDING';
  const isMasterTarget = staff.role === 'MASTER_ADMIN';
  const canEditName = isSelf || (canManage && !isMasterTarget && !isPending);
  const canEditRole = canManage && !isSelf && !isMasterTarget && !isPending;
  const canToggleStatus =
    canManage &&
    !isSelf &&
    !isMasterTarget &&
    (staff.status === 'ACTIVE' || staff.status === 'DISABLED');
  const canWithdraw =
    canManage &&
    !isSelf &&
    !isMasterTarget &&
    !isPending &&
    staff.status !== 'WITHDRAWN';
  const nameChanged = formName.trim() !== staff.name;
  const roleChanged = formRole !== staff.role;
  const hasChanges = canEditRole ? nameChanged || roleChanged : nameChanged;

  const handleSave = async () => {
    if (!canEditName && !canEditRole) return;
    if (!formName.trim()) {
      setFormError('이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    setFormError('');

    try {
      const payload: { name?: string; role?: string } = {};
      if (canEditName) {
        payload.name = formName.trim();
      }
      if (canEditRole) {
        payload.role = formRole;
      }

      const res = await fetch(`/api/hospitals/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        setFormError(result.error || '직원 정보 수정에 실패했습니다.');
        return;
      }
      setStaff((prev) =>
        prev
          ? {
              ...prev,
              name: result.user?.name ?? formName.trim(),
              role: result.user?.role ?? formRole,
            }
          : prev,
      );
    } catch (err) {
      console.error(err);
      setFormError('직원 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (!canManage) return;
    setStatusSaving(true);
    setStatusError('');

    try {
      const res = await fetch(`/api/hospitals/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        setStatusError(result.error || '상태 변경에 실패했습니다.');
        return;
      }
      setStaff((prev) =>
        prev
          ? {
              ...prev,
              status: result.user?.status ?? nextStatus,
              statusChangedAt:
                result.user?.statusChangedAt ?? prev.statusChangedAt,
            }
          : prev,
      );
    } catch (err) {
      console.error(err);
      setStatusError('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/hospital/staff" className="hover:text-foreground">
            직원 관리
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={listHref} className="hover:text-foreground">
            직원 목록
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">상세</span>
        </nav>
        <Button variant="outline" asChild>
          <Link href={listHref}>목록으로</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{staff.name}</h1>
          <Badge className={USER_STATUS_COLORS[staff.status] ?? ''}>
            {ACCOUNT_STATUS_LABELS[staff.status] ?? staff.status}
          </Badge>
          <Badge className={USER_ROLE_COLORS[staff.role] ?? ''}>
            {ACCOUNT_ROLE_LABELS[staff.role] ?? staff.role}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{staff.email}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isPending && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          초대 수락 대기 상태입니다. 초대 재발송은 목록에서 진행할 수 있습니다.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">기본 정보</h2>
              {!canManage && !isSelf && (
                <span className="text-xs text-muted-foreground">
                  마스터 관리자만 수정할 수 있습니다.
                </span>
              )}
              {isSelf && (
                <span className="text-xs text-muted-foreground">
                  내 계정은 이름만 수정할 수 있습니다.
                </span>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staff-name">이름</Label>
                <Input
                  id="staff-name"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  disabled={!canEditName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">이메일</Label>
                <Input id="staff-email" value={staff.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">권한</Label>
                <Select
                  id="staff-role"
                  value={formRole}
                  onChange={(event) => setFormRole(event.target.value)}
                  disabled={!canEditRole}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-department">부서</Label>
                <Input
                  id="staff-department"
                  value={staff.departmentName ?? '-'}
                  disabled
                />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={
                  saving || !hasChanges || (!canEditName && !canEditRole)
                }
              >
                {saving ? '저장 중...' : '정보 수정'}
              </Button>
              {isMasterTarget && !isSelf && (
                <span className="text-xs text-muted-foreground">
                  마스터 관리자 계정은 수정할 수 없습니다.
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">상태 관리</h2>
            <p className="text-sm text-muted-foreground">
              상태 변경은 즉시 반영되며, 비활성 또는 탈퇴 시 로그인이
              제한됩니다.
            </p>
            {statusError && (
              <p className="text-sm text-destructive">{statusError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {canToggleStatus && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    handleStatusChange(
                      staff.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                    )
                  }
                  disabled={statusSaving}
                >
                  {statusSaving
                    ? '처리 중...'
                    : staff.status === 'ACTIVE'
                      ? '비활성화'
                      : '활성화'}
                </Button>
              )}
              {canWithdraw && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const confirmed =
                      window.confirm('해당 직원을 탈퇴 처리할까요?');
                    if (confirmed) {
                      handleStatusChange('WITHDRAWN');
                    }
                  }}
                  disabled={statusSaving}
                >
                  {statusSaving ? '처리 중...' : '탈퇴 처리'}
                </Button>
              )}
              {!canManage && (
                <span className="text-xs text-muted-foreground">
                  마스터 관리자만 변경할 수 있습니다.
                </span>
              )}
              {isSelf && (
                <span className="text-xs text-muted-foreground">
                  내 계정은 직접 변경할 수 없습니다.
                </span>
              )}
              {isMasterTarget && (
                <span className="text-xs text-muted-foreground">
                  마스터 관리자 계정은 변경할 수 없습니다.
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
