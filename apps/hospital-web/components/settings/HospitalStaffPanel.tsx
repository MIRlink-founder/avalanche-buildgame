'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@mire/ui';
import { Button } from '@mire/ui';
import { Input } from '@mire/ui';
import { Label } from '@mire/ui';
import { Select } from '@mire/ui';
import { Tabs } from '@/components/layout/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mire/ui/components/dialog';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { getPayloadFromToken } from '@/lib/decode-token';
import {
  ACCOUNT_ROLE_LABELS,
  ACCOUNT_STATUS_LABELS,
  USER_ROLE_COLORS,
  USER_STATUS_COLORS,
} from '@/lib/admin-hospital-format';
import { Pagination } from '@/components/admin/Pagination';
import { Search, UserPlus } from 'lucide-react';

const PAGE_SIZE = 10;
const SUGGESTION_PAGE_SIZE = 6;
const STAFF_TABS = [
  { id: 'all', label: '전체' },
  { id: 'active', label: '활성' },
  { id: 'inactive', label: '비활성/탈퇴' },
  { id: 'pending', label: '초대 수락 대기' },
];

const ROLE_OPTIONS = [
  { value: 'MASTER_ADMIN', label: '관리자' },
  { value: 'DEPT_ADMIN', label: '일반' },
];

type StaffSummary = {
  total: number;
  active: number;
  pending: number;
  disabled: number;
  withdrawn: number;
};

interface HospitalUser {
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

interface UsersApiResponse {
  users: HospitalUser[];
  totalCount: number;
  totalPages: number;
  pageSize: number;
  page: number;
  summary: StaffSummary;
}

function getStatusFilter(tab: string): string[] | null {
  switch (tab) {
    case 'active':
      return ['ACTIVE'];
    case 'pending':
      return ['PENDING'];
    case 'inactive':
      return ['DISABLED', 'WITHDRAWN'];
    case 'disabled':
      return ['DISABLED'];
    case 'withdrawn':
      return ['WITHDRAWN'];
    default:
      return null;
  }
}

export function HospitalStaffPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get('tab') ?? 'all';
  const searchQuery = searchParams.get('search') ?? '';
  const pageParam = searchParams.get('page') ?? '1';
  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const statusFilter = useMemo(() => getStatusFilter(currentTab), [currentTab]);

  const [data, setData] = useState<UsersApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [suggestions, setSuggestions] = useState<HospitalUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSending, setInviteSending] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HospitalUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('DEPT_ADMIN');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const summary: StaffSummary = data?.summary ?? {
    total: 0,
    active: 0,
    pending: 0,
    disabled: 0,
    withdrawn: 0,
  };

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const query = searchInput.trim();

    if (!query || !searchFocused) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSuggesting(false);
      return;
    }

    let cancelled = false;
    setIsSuggesting(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('pageSize', String(SUGGESTION_PAGE_SIZE));
        params.set('search', query);
        if (statusFilter && statusFilter.length > 0) {
          params.set('status', statusFilter.join(','));
        }

        const res = await fetch(`/api/hospitals/staff?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        if (redirectIfUnauthorized(res)) return;
        const payload = (await res
          .json()
          .catch(() => ({}))) as Partial<UsersApiResponse>;
        if (cancelled) return;
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        setSuggestions(payload.users ?? []);
        setShowSuggestions(searchFocused);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsSuggesting(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchFocused, searchInput, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const payload = token ? getPayloadFromToken(token) : null;
    setCurrentUserEmail(payload?.email ?? '');
    setCurrentUserRole(payload?.role ?? '');
  }, []);

  const canManage = currentUserRole === 'MASTER_ADMIN';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (statusFilter && statusFilter.length > 0) {
      params.set('status', statusFilter.join(','));
    }

    fetch(`/api/hospitals/staff?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('직원 목록 조회에 실패했습니다.');
        return res.json();
      })
      .then((json: UsersApiResponse | null) => {
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
  }, [page, searchQuery, statusFilter, refreshTrigger]);

  const users = useMemo(() => data?.users ?? [], [data]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setShowSuggestions(false);
    router.push(`/hospital/staff?${params.toString()}`);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('이메일을 입력해주세요.');
      return;
    }

    setInviteSending(true);
    setInviteError('');

    try {
      const res = await fetch('/api/hospitals/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          email: inviteEmail.trim(),
        }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        setInviteError(result.error || '직원 초대에 실패했습니다.');
        return;
      }

      if (result.mailSent === false) {
        alert(
          '초대 처리되었습니다. 단, 메일 발송에 실패했습니다. SMTP 설정을 확인해주세요.',
        );
      }
      setInviteOpen(false);
      setInviteEmail('');
      setInviteError('');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setInviteError('직원 초대 중 오류가 발생했습니다.');
    } finally {
      setInviteSending(false);
    }
  };

  const handleResendInvite = async (email: string) => {
    if (!email) return;
    setActionLoadingId(email);
    try {
      const res = await fetch('/api/hospitals/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || '재발송에 실패했습니다.');
        return;
      }
      if (result.mailSent === false) {
        alert('재발송 처리되었습니다. 단, 메일 발송에 실패했습니다.');
      } else {
        alert('초대 메일을 재발송했습니다.');
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert('재발송 중 오류가 발생했습니다.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (userId: string, nextStatus: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/hospitals/staff/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || '상태 변경에 실패했습니다.');
        return;
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditDialog = (target: HospitalUser) => {
    setEditTarget(target);
    setEditName(target.name);
    setEditRole(target.role);
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editName.trim()) {
      setEditError('이름을 입력해주세요.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const res = await fetch(`/api/hospitals/staff/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole,
        }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        setEditError(result.error || '직원 정보 수정에 실패했습니다.');
        return;
      }
      setEditOpen(false);
      setEditTarget(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setEditError('직원 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  const basePath = '/hospital/staff';

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">전체 직원</p>
          <p className="mt-2 text-3xl font-semibold">
            {summary.total.toLocaleString('ko-KR')}명
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">활성 직원</p>
          <p className="mt-2 text-3xl font-semibold">
            {summary.active.toLocaleString('ko-KR')}명
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">초대 수락 대기</p>
          <p className="mt-2 text-3xl font-semibold">
            {summary.pending.toLocaleString('ko-KR')}명
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-sm">비활성/탈퇴</p>
          <p className="mt-2 text-3xl font-semibold">
            {(summary.disabled + summary.withdrawn).toLocaleString('ko-KR')}명
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <Tabs tabs={STAFF_TABS} basePath={basePath} defaultTab="all" />

        <div className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            className="flex w-full flex-wrap items-center gap-2 md:w-auto"
          >
            <div className="w-full md:w-[360px]">
              <div className="relative">
                <Input
                  value={searchInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchInput(value);
                    if (!value.trim()) {
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => {
                    setSearchFocused(true);
                    if (searchInput.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setSearchFocused(false);
                      setShowSuggestions(false);
                    }, 150);
                  }}
                  aria-label="직원 검색"
                  placeholder="이름 또는 이메일 검색"
                  className="bg-background"
                />
                {showSuggestions && (
                  <div className="border-border bg-background absolute left-0 top-full z-20 mt-2 w-full rounded-md border shadow-sm">
                    {isSuggesting ? (
                      <div className="text-muted-foreground px-3 py-2 text-xs">
                        검색 중...
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="text-muted-foreground px-3 py-2 text-xs">
                        검색 결과가 없습니다.
                      </div>
                    ) : (
                      suggestions.map((user) => {
                        const primaryLabel = user.name || user.email;
                        const secondaryLabel =
                          user.name && user.email ? user.email : '';
                        return (
                          <button
                            key={user.id}
                            type="button"
                            className="hover:bg-secondary flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setSearchInput(primaryLabel);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="font-medium">{primaryLabel}</span>
                            {secondaryLabel && (
                              <span className="text-muted-foreground text-xs">
                                {secondaryLabel}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              type="submit"
              size="xl"
              variant="outline"
              className="w-full md:w-auto"
            >
              <Search className="h-4 w-4" />
              조회
            </Button>
          </form>
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto" type="button">
                  <UserPlus className="h-4 w-4" />
                  직원 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>직원 추가</DialogTitle>
                  <DialogDescription>
                    직원 이메일을 등록하면 가입 링크가 발송됩니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">이메일</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                  {inviteError && (
                    <p className="text-sm text-destructive">{inviteError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setInviteOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    onClick={handleInvite}
                    disabled={inviteSending}
                  >
                    {inviteSending ? '발송 중...' : '추가하기'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    권한
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      불러오는 중...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      등록된 직원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = currentUserEmail === u.email;
                    const canToggleStatus =
                      canManage &&
                      !isSelf &&
                      u.role !== 'MASTER_ADMIN' &&
                      (u.status === 'ACTIVE' || u.status === 'DISABLED');
                    const canWithdraw =
                      canManage &&
                      !isSelf &&
                      u.role !== 'MASTER_ADMIN' &&
                      u.status !== 'WITHDRAWN';
                    const canEdit =
                      canManage && !isSelf && u.status !== 'PENDING';
                    const isPending = u.status === 'PENDING';
                    return (
                      <tr key={u.id}>
                        <td className="px-4 py-3">{u.name}</td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {u.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={USER_ROLE_COLORS[u.role] ?? ''}>
                            {ACCOUNT_ROLE_LABELS[u.role] ?? u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={USER_STATUS_COLORS[u.status] ?? ''}>
                            {ACCOUNT_STATUS_LABELS[u.status] ?? u.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {isPending && canManage ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvite(u.email)}
                              disabled={actionLoadingId === u.email}
                            >
                              {actionLoadingId === u.email
                                ? '발송 중...'
                                : '초대 재발송'}
                            </Button>
                          ) : canEdit || canToggleStatus || canWithdraw ? (
                            <div className="flex flex-wrap gap-2">
                              {canEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(u)}
                                  disabled={actionLoadingId === u.id}
                                >
                                  정보 수정
                                </Button>
                              )}
                              {canToggleStatus && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStatusChange(
                                      u.id,
                                      u.status === 'ACTIVE'
                                        ? 'DISABLED'
                                        : 'ACTIVE',
                                    )
                                  }
                                  disabled={actionLoadingId === u.id}
                                >
                                  {actionLoadingId === u.id
                                    ? '처리 중...'
                                    : u.status === 'ACTIVE'
                                      ? '비활성화'
                                      : '활성화'}
                                </Button>
                              )}
                              {canWithdraw && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const confirmed =
                                      window.confirm(
                                        '해당 직원을 탈퇴 처리할까요?',
                                      );
                                    if (confirmed) {
                                      handleStatusChange(u.id, 'WITHDRAWN');
                                    }
                                  }}
                                  disabled={actionLoadingId === u.id}
                                >
                                  탈퇴 처리
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {isSelf
                                ? '내 계정'
                                : !canManage
                                  ? '권한 없음'
                                  : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={data?.page ?? page}
          totalPages={data?.totalPages ?? 1}
          totalCount={data?.totalCount ?? 0}
          pageSize={data?.pageSize ?? PAGE_SIZE}
          basePath={basePath}
        />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>직원 정보 수정</DialogTitle>
            <DialogDescription>
              이름과 권한을 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">이름</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">권한</Label>
              <Select
                id="edit-role"
                value={editRole}
                onChange={(event) => setEditRole(event.target.value)}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setEditOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleEditSave}
              disabled={editSaving}
            >
              {editSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
