'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@mire/ui';
import { Button } from '@mire/ui';
import { Input } from '@mire/ui';
import { Label } from '@mire/ui';
import { cn } from '@mire/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mire/ui/components/dialog';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import { getPayloadFromToken } from '@/lib/decode-token';
import {
  ACCOUNT_ROLE_LABELS,
  USER_ROLE_COLORS,
} from '@/lib/admin-hospital-format';
import { Pagination } from '@/components/admin/Pagination';
import { Plus, Settings } from 'lucide-react';

const PAGE_SIZE = 10;
const SUGGESTION_PAGE_SIZE = 6;

const STAFF_STATUS_TEXT: Record<string, string> = {
  ACTIVE: '정상',
  PENDING: '초대대기',
  DISABLED: '비활성화',
  WITHDRAWN: '탈퇴',
};

function formatAccessDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

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

interface HospitalStaffPanelProps {
  basePath?: string;
  tabParamName?: string;
}

export function HospitalStaffPanel({
  basePath: basePathProp = '/hospital/staff',
  tabParamName = 'tab',
}: HospitalStaffPanelProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('search') ?? '';
  const pageParam = searchParams.get('page') ?? '1';
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const [data, setData] = useState<UsersApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [suggestions, setSuggestions] = useState<HospitalUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // 초대 다이얼로그
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [inviteRole, setInviteRole] = useState('MASTER_ADMIN');
  const [inviteError, setInviteError] = useState('');
  const [inviteSending, setInviteSending] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // 톱니바퀴 메뉴
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // 상태 변경 다이얼로그
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogUser, setStatusDialogUser] = useState<HospitalUser | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');

  // 정보 수정 모달
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogUser, setEditDialogUser] = useState<HospitalUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState('DEPT_ADMIN');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // 토스트
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  }, [searchFocused, searchInput]);

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

    fetch(`/api/hospitals/staff?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('멤버 목록 조회에 실패했습니다.');
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
  }, [page, searchQuery, refreshTrigger]);

  const users = useMemo(() => data?.users ?? [], [data]);
  const basePath = basePathProp;

  // 톱니바퀴 메뉴 외부 클릭 닫기
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-gear-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setShowSuggestions(false);
    router.push(`${basePath}?${params.toString()}`);
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteName('');
    setInviteDepartment('');
    setInviteRole('MASTER_ADMIN');
    setInviteError('');
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('이메일을 입력해주세요.');
      return;
    }
    if (!inviteName.trim()) {
      setInviteError('이름을 입력해주세요.');
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
          name: inviteName.trim(),
          department: inviteDepartment.trim() || undefined,
          role: inviteRole,
        }),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        setInviteError(result.error || '멤버 초대에 실패했습니다.');
        return;
      }

      if (result.mailSent === false) {
        alert(
          '초대 처리되었습니다. 단, 메일 발송에 실패했습니다. SMTP 설정을 확인해주세요.',
        );
      }
      setInviteOpen(false);
      resetInviteForm();
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setInviteError('멤버 초대 중 오류가 발생했습니다.');
    } finally {
      setInviteSending(false);
    }
  };

  // 토스트 자동 소멸
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // 정보 수정 모달 열기
  const handleOpenEditDialog = async (user: HospitalUser) => {
    setOpenMenuId(null);
    setEditDialogUser(user);
    setEditName(user.name);
    setEditDepartment(user.departmentName ?? '');
    setEditRole(user.role);
    setEditError('');
    setEditDialogOpen(true);
  };

  // 정보 수정 저장
  const handleEditSave = async () => {
    if (!editDialogUser) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('이름을 입력해주세요.');
      return;
    }
    if (trimmedName.length > 20) {
      setEditError('이름은 최대 20자까지 입력 가능합니다.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const payload: { name?: string; role?: string; departmentName?: string } = {};
      if (trimmedName !== editDialogUser.name) {
        payload.name = trimmedName;
      }
      if (editRole !== editDialogUser.role) {
        payload.role = editRole;
      }
      const trimmedDept = editDepartment.trim();
      if (trimmedDept !== (editDialogUser.departmentName ?? '')) {
        payload.departmentName = trimmedDept;
      }

      if (Object.keys(payload).length === 0) {
        setEditDialogOpen(false);
        return;
      }

      const res = await fetch(`/api/hospitals/staff/${editDialogUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (redirectIfUnauthorized(res)) return;
      const result = await res.json();
      if (!res.ok) {
        setEditError(result.error || '정보 수정에 실패했습니다.');
        return;
      }

      setEditDialogOpen(false);
      setEditDialogUser(null);
      setToastMessage('계정 정보가 수정되었습니다.');
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setEditError('정보 수정 중 오류가 발생했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  const editNameValid = editName.trim().length > 0 && editName.trim().length <= 20;

  const handleOpenStatusDialog = (user: HospitalUser) => {
    setOpenMenuId(null);
    setStatusDialogUser(user);
    setSelectedStatus(user.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE');
    setStatusDialogOpen(true);
  };

  const handleStatusApply = async () => {
    if (!statusDialogUser) return;
    if (selectedStatus !== statusDialogUser.status) {
      setActionLoadingId(statusDialogUser.id);
      try {
        const res = await fetch(`/api/hospitals/staff/${statusDialogUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status: selectedStatus }),
        });
        if (redirectIfUnauthorized(res)) return;
        const result = await res.json();
        if (!res.ok) {
          setToastMessage(result.error || '설정 변경에 실패했습니다.');
          return;
        }
        setToastMessage('계정 설정이 변경되었습니다.');
        setRefreshTrigger((prev) => prev + 1);
      } catch {
        setToastMessage('설정 변경에 실패했습니다.');
      } finally {
        setActionLoadingId(null);
      }
    }
    setStatusDialogOpen(false);
    setStatusDialogUser(null);
  };

  const showGearIcon = (user: HospitalUser) =>
    user.status !== 'PENDING' && user.status !== 'WITHDRAWN';

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 + 멤버 초대 */}
      <div className="flex items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative w-[320px]">
            <Input
              value={searchInput}
              onChange={(e) => {
                const value = e.target.value;
                setSearchInput(value);
                if (!value.trim()) setShowSuggestions(false);
              }}
              onFocus={() => {
                setSearchFocused(true);
                if (searchInput.trim()) setShowSuggestions(true);
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setSearchFocused(false);
                  setShowSuggestions(false);
                }, 150);
              }}
              placeholder="이름, 이메일 검색"
              className="h-10 bg-background"
            />
            {showSuggestions && (
              <div className="absolute left-0 top-full z-20 mt-0 w-full rounded-md border border-border bg-background shadow-sm">
                {isSuggesting ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    검색 중...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
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
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-secondary"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchInput(primaryLabel);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-medium">{primaryLabel}</span>
                        {secondaryLabel && (
                          <span className="text-xs text-muted-foreground">
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
          <Button type="submit" className="h-10">
            검색
          </Button>
        </form>
        {canManage && (
          <Dialog
            open={inviteOpen}
            onOpenChange={(open) => {
              setInviteOpen(open);
              if (!open) resetInviteForm();
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" className="h-10">
                <Plus className="h-4 w-4" />
                멤버 초대
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>멤버 초대하기</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">
                    이메일 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="example@mirlink.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-name">
                    이름 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invite-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-department">소속 부서</Label>
                  <Input
                    id="invite-department"
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                    placeholder="소속 부서를 입력하세요"
                  />
                </div>
                <div className="space-y-3">
                  <Label>
                    권한 설정 <span className="text-destructive">*</span>
                  </Label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                      inviteRole === 'MASTER_ADMIN'
                        ? 'border-primary'
                        : 'border-border',
                    )}
                  >
                    <input
                      type="radio"
                      name="invite-role"
                      value="MASTER_ADMIN"
                      checked={inviteRole === 'MASTER_ADMIN'}
                      onChange={() => setInviteRole('MASTER_ADMIN')}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <div>
                      <span className="font-medium">관리자</span>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        모든 권한 및 설정 관리 가능
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                      inviteRole === 'DEPT_ADMIN'
                        ? 'border-primary'
                        : 'border-border',
                    )}
                  >
                    <input
                      type="radio"
                      name="invite-role"
                      value="DEPT_ADMIN"
                      checked={inviteRole === 'DEPT_ADMIN'}
                      onChange={() => setInviteRole('DEPT_ADMIN')}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <div>
                      <span className="font-medium">일반</span>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        환자 정보 조회 및 진료 기록 작성
                      </p>
                    </div>
                  </label>
                </div>
                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setInviteOpen(false);
                    resetInviteForm();
                  }}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={handleInvite}
                  disabled={inviteSending}
                >
                  {inviteSending ? '발송 중...' : '초대 메일 발송'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-[10%] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  이름
                </th>
                <th className="w-[20%] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  이메일
                </th>
                <th className="w-[10%] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  부서
                </th>
                <th className="w-[10%] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  권한
                </th>
                <th className="w-[10%] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  상태
                </th>
                <th className="w-[18%] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  최근 접속
                </th>
                <th className="w-[10%] px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    등록된 멤버가 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-4 text-center text-sm">
                        {u.name}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        {u.email}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        {u.departmentName || '-'}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        <Badge className={USER_ROLE_COLORS[u.role] ?? ''}>
                          {ACCOUNT_ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        {STAFF_STATUS_TEXT[u.status] ?? u.status}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        {formatAccessDate(u.lastAccessAt)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {showGearIcon(u) ? (
                          <div
                            className="relative inline-block"
                            data-gear-menu
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === u.id ? null : u.id,
                                )
                              }
                              className="rounded p-1 text-muted-foreground hover:text-foreground"
                            >
                              <Settings className="h-5 w-5" />
                            </button>
                            {openMenuId === u.id && (
                              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-md border bg-background py-1 shadow-md">
                                <button
                                  type="button"
                                  className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => handleOpenEditDialog(u)}
                                >
                                  정보 수정
                                </button>
                                {canManage &&
                                  currentUserEmail !== u.email && (
                                    <button
                                      type="button"
                                      className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                                      onClick={() =>
                                        handleOpenStatusDialog(u)
                                      }
                                    >
                                      계정 상태 변경
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      <Pagination
        currentPage={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalCount={data?.totalCount ?? 0}
        pageSize={data?.pageSize ?? PAGE_SIZE}
        basePath={basePath}
      />

      {/* 계정 상태 변경 다이얼로그 */}
      <Dialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open);
          if (!open) setStatusDialogUser(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>계정 상태 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                selectedStatus === 'ACTIVE'
                  ? 'border-primary'
                  : 'border-border',
              )}
            >
              <input
                type="radio"
                name="account-status"
                value="ACTIVE"
                checked={selectedStatus === 'ACTIVE'}
                onChange={() => setSelectedStatus('ACTIVE')}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-medium">활성화</span>
            </label>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                selectedStatus === 'DISABLED'
                  ? 'border-primary'
                  : 'border-border',
              )}
            >
              <input
                type="radio"
                name="account-status"
                value="DISABLED"
                checked={selectedStatus === 'DISABLED'}
                onChange={() => setSelectedStatus('DISABLED')}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-medium">비활성화</span>
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setStatusDialogOpen(false);
                setStatusDialogUser(null);
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleStatusApply}
              disabled={
                statusDialogUser
                  ? actionLoadingId === statusDialogUser.id
                  : false
              }
            >
              {statusDialogUser && actionLoadingId === statusDialogUser.id
                ? '처리 중...'
                : '완료'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 정보 수정 모달 */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditDialogUser(null);
            setEditError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>정보 수정</DialogTitle>
          </DialogHeader>
          {editDialogUser && (
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-email"
                  value={editDialogUser.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="홍길동"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">소속 부서</Label>
                <Input
                  id="edit-department"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="운영부"
                  maxLength={100}
                />
              </div>
              {canManage && editDialogUser && currentUserEmail !== editDialogUser.email && (
                <div className="space-y-3">
                  <Label>
                    권한 설정 <span className="text-destructive">*</span>
                  </Label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                      editRole === 'MASTER_ADMIN'
                        ? 'border-primary'
                        : 'border-border',
                    )}
                  >
                    <input
                      type="radio"
                      name="edit-role"
                      value="MASTER_ADMIN"
                      checked={editRole === 'MASTER_ADMIN'}
                      onChange={() => setEditRole('MASTER_ADMIN')}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <div>
                      <span className="font-medium">관리자</span>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        모든 권한 및 설정 관리 가능
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                      editRole === 'DEPT_ADMIN'
                        ? 'border-primary'
                        : 'border-border',
                    )}
                  >
                    <input
                      type="radio"
                      name="edit-role"
                      value="DEPT_ADMIN"
                      checked={editRole === 'DEPT_ADMIN'}
                      onChange={() => setEditRole('DEPT_ADMIN')}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <div>
                      <span className="font-medium">일반</span>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        환자 정보 조회 및 진료 기록 작성
                      </p>
                    </div>
                  </label>
                </div>
              )}
              {editError && (
                <p className="text-sm text-destructive">{editError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setEditDialogOpen(false);
                setEditDialogUser(null);
                setEditError('');
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleEditSave}
              disabled={editSaving || !editNameValid}
            >
              {editSaving ? '저장 중...' : '변경 사항 저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 토스트 */}
      {toastMessage && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-lg bg-primary px-5 py-3 text-sm text-primary-foreground shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
