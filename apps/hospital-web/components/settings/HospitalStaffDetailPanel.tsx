'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Badge } from '@mire/ui';
import { Button } from '@mire/ui';
import { Input } from '@mire/ui';
import { Label } from '@mire/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mire/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  departmentId: number | null;
  departmentName: string | null;
  statusChangedAt: string | null;
  createdAt: string;
  lastAccessAt: string | null;
}

interface DepartmentOption {
  id: number;
  name: string;
}

interface InlineSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function InlineSelect({
  id,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  value: string;
  options: InlineSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? '선택';

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && !disabled && (
        <div className="border-border bg-background absolute left-0 top-full z-20 mt-0 w-full rounded-md border shadow-sm">
          <div className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                  option.disabled
                    ? 'text-muted-foreground cursor-not-allowed'
                    : ''
                }`}
              >
                <span
                  className={
                    option.value === value ? 'font-semibold' : 'font-normal'
                  }
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StaffDetailResponse {
  user: HospitalUserDetail;
  activeAdminCount?: number;
}

export function HospitalStaffDetailPanel() {
  const params = useParams();
  const searchParams = useSearchParams();
  const staffId = params?.id as string | undefined;

  const [staff, setStaff] = useState<HospitalUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formRole, setFormRole] = useState('DEPT_ADMIN');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formError, setFormError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [activeAdminCount, setActiveAdminCount] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState('');
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [adminGuardOpen, setAdminGuardOpen] = useState(false);

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
          setFormRole(data.user.role);
          setFormDepartmentId(
            data.user.departmentId ? String(data.user.departmentId) : '',
          );
          setActiveAdminCount(
            typeof data.activeAdminCount === 'number'
              ? data.activeAdminCount
              : null,
          );
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

  useEffect(() => {
    if (currentUserRole !== 'MASTER_ADMIN') return;
    let cancelled = false;
    setDepartmentsLoading(true);
    setDepartmentsError('');

    fetch('/api/hospitals/departments', {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('부서 목록을 불러오지 못했습니다.');
        return res.json();
      })
      .then((data: { departments?: DepartmentOption[] } | null) => {
        if (!cancelled) {
          setDepartments(data?.departments ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDepartmentsError(
            err.message || '부서 목록을 불러오지 못했습니다.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDepartmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserRole]);

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
  const isWithdrawn = staff.status === 'WITHDRAWN';
  const isLastActiveAdmin =
    staff.role === 'MASTER_ADMIN' &&
    staff.status === 'ACTIVE' &&
    activeAdminCount === 1;
  const canEditRole = canManage && !isWithdrawn;
  const canEditDepartment = canManage && !isWithdrawn;
  const canToggleStatus =
    canManage &&
    !isSelf &&
    !isWithdrawn &&
    (staff.status === 'ACTIVE' || staff.status === 'DISABLED');
  const roleChanged = formRole !== staff.role;
  const departmentChanged =
    String(staff.departmentId ?? '') !== formDepartmentId;
  const hasChanges =
    (canEditRole && roleChanged) || (canEditDepartment && departmentChanged);
  const roleOptions: InlineSelectOption[] = ROLE_OPTIONS.map((role) => ({
    value: role.value,
    label: role.label,
  }));
  const departmentOptions: InlineSelectOption[] = [
    { value: '', label: '미지정' },
    ...departments.map((department) => ({
      value: String(department.id),
      label: department.name,
    })),
  ];

  const handleRoleChange = (nextRole: string) => {
    if (isLastActiveAdmin && nextRole !== 'MASTER_ADMIN') {
      setAdminGuardOpen(true);
      return;
    }
    setFormRole(nextRole);
  };

  const handleSave = async () => {
    if (!canEditRole && !canEditDepartment) return;
    if (isLastActiveAdmin && formRole !== 'MASTER_ADMIN') {
      setAdminGuardOpen(true);
      return;
    }
    setSaving(true);
    setFormError('');

    try {
      const payload: { role?: string; departmentId?: number | null } = {};
      if (canEditRole && roleChanged) {
        payload.role = formRole;
      }
      if (canEditDepartment && departmentChanged) {
        payload.departmentId = formDepartmentId
          ? Number(formDepartmentId)
          : null;
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
      const wasActiveAdmin =
        staff.role === 'MASTER_ADMIN' && staff.status === 'ACTIVE';
      const nextRole = result.user?.role ?? formRole;
      const willBeActiveAdmin =
        nextRole === 'MASTER_ADMIN' && staff.status === 'ACTIVE';
      setStaff((prev) =>
        prev
          ? {
              ...prev,
              role: result.user?.role ?? formRole,
              departmentId:
                result.user?.departmentId ??
                payload.departmentId ??
                prev.departmentId,
              departmentName:
                result.user?.departmentName ?? prev.departmentName,
            }
          : prev,
      );
      if (activeAdminCount !== null) {
        if (wasActiveAdmin && !willBeActiveAdmin) {
          setActiveAdminCount((prev) =>
            prev === null ? prev : Math.max(0, prev - 1),
          );
        } else if (!wasActiveAdmin && willBeActiveAdmin) {
          setActiveAdminCount((prev) => (prev === null ? prev : prev + 1));
        }
      }
    } catch (err) {
      console.error(err);
      setFormError('직원 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (!canManage) return;
    if (nextStatus === 'DISABLED' && isLastActiveAdmin) {
      setAdminGuardOpen(true);
      return;
    }
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
      const wasActiveAdmin =
        staff.role === 'MASTER_ADMIN' && staff.status === 'ACTIVE';
      const willBeActiveAdmin =
        staff.role === 'MASTER_ADMIN' && nextStatus === 'ACTIVE';
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
      if (activeAdminCount !== null) {
        if (wasActiveAdmin && !willBeActiveAdmin) {
          setActiveAdminCount((prev) =>
            prev === null ? prev : Math.max(0, prev - 1),
          );
        } else if (!wasActiveAdmin && willBeActiveAdmin) {
          setActiveAdminCount((prev) => (prev === null ? prev : prev + 1));
        }
      }
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

      <section className="rounded-lg border bg-card p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">기본 정보</h2>
              {isWithdrawn && (
                <span className="text-xs text-muted-foreground">
                  탈퇴한 계정은 권한/부서를 수정할 수 없습니다.
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">이름</Label>
                <Input id="staff-name" value={staff.name} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">이메일</Label>
                <Input id="staff-email" value={staff.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">권한</Label>
                {canEditRole ? (
                  <InlineSelect
                    id="staff-role"
                    value={formRole}
                    options={roleOptions}
                    disabled={!canEditRole}
                    onChange={handleRoleChange}
                  />
                ) : (
                  <Input
                    id="staff-role"
                    value={ACCOUNT_ROLE_LABELS[staff.role] ?? staff.role}
                    disabled
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-department">부서</Label>
                {canEditDepartment ? (
                  <InlineSelect
                    id="staff-department"
                    value={formDepartmentId}
                    options={departmentOptions}
                    disabled={departmentsLoading}
                    onChange={setFormDepartmentId}
                  />
                ) : (
                  <Input
                    id="staff-department"
                    value={staff.departmentName ?? '-'}
                    disabled
                  />
                )}
                {departmentsError && canEditDepartment && (
                  <p className="text-xs text-destructive">{departmentsError}</p>
                )}
              </div>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            {!isWithdrawn && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !hasChanges ||
                    (!canEditRole && !canEditDepartment)
                  }
                >
                  {saving ? '저장 중...' : '정보 수정'}
                </Button>
              </div>
            )}
          </div>

          {!isWithdrawn && (
            <div className="border-t pt-6">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">상태 관리</h2>
                {statusError && (
                  <p className="text-sm text-destructive">{statusError}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {canToggleStatus && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (staff.status === 'ACTIVE') {
                          if (isLastActiveAdmin) {
                            setAdminGuardOpen(true);
                            return;
                          }
                          setDisableConfirmOpen(true);
                          return;
                        }
                        void handleStatusChange('ACTIVE');
                      }}
                      disabled={statusSaving}
                    >
                      {statusSaving
                        ? '처리 중...'
                        : staff.status === 'ACTIVE'
                          ? '비활성화'
                          : '활성화'}
                    </Button>
                  )}
                  {isSelf && (
                    <p className="text-sm text-muted-foreground">
                      내 계정은 직접 변경할 수 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog open={disableConfirmOpen} onOpenChange={setDisableConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>직원 비활성화</DialogTitle>
            <DialogDescription>
              비활성화하면 해당 계정은 로그인할 수 없습니다. 계속 진행할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisableConfirmOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                await handleStatusChange('DISABLED');
                setDisableConfirmOpen(false);
              }}
              disabled={statusSaving}
            >
              {statusSaving ? '처리 중...' : '비활성화'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={adminGuardOpen} onOpenChange={setAdminGuardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>변경할 수 없습니다</DialogTitle>
            <DialogDescription>
              관리자는 최소 1명 이상 유지되어야 합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setAdminGuardOpen(false)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
