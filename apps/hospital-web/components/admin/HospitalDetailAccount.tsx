'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  formatDate,
  ACCOUNT_ROLE_LABELS,
  ACCOUNT_STATUS_LABELS,
  USER_ROLE_COLORS,
  USER_STATUS_COLORS,
} from '@/lib/admin-hospital-format';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';
import type { HospitalDetail } from '@/lib/admin-hospital-types';
import { Badge } from '@mire/ui';
import { Button } from '@mire/ui';
import { Input } from '@mire/ui';
import { Search } from 'lucide-react';
import { Pagination } from './Pagination';

const PAGE_SIZE = 10;

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
}

interface HospitalDetailAccountProps {
  hospital: HospitalDetail;
  onRefresh: () => void;
}

export function HospitalDetailAccount({
  hospital,
  onRefresh,
}: HospitalDetailAccountProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('search') ?? '';
  const pageParam = searchParams.get('page') ?? '1';
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const [users, setUsers] = useState<HospitalUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const fetchUsers = useCallback(() => {
    if (!hospital.id) return;
    setUsersLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    fetch(`/api/admin/hospitals/${hospital.id}/users?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('계정 목록 조회에 실패했습니다.');
        return res.json();
      })
      .then((data: UsersApiResponse | null) => {
        if (data) {
          setUsers(data.users);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
        }
      })
      .catch(() => {
        setUsers([]);
        setTotalCount(0);
        setTotalPages(1);
      })
      .finally(() => setUsersLoading(false));
  }, [hospital.id, page, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/admin/hospitals/${hospital.id}?${params.toString()}`);
  };

  const basePath = `/admin/hospitals/${hospital.id}`;

  return (
    <div className="space-y-6">
      {/* 계정 관리: 검색 + 테이블 + 페이지네이션 */}
      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <Input
          type="text"
          placeholder="이름, 이메일 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
          maxLength={100}
        />
        <Button type="submit" size="xl">
          <Search className="h-4 w-4" />
          검색
        </Button>
      </form>

      <div className="mt-4 rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  이름
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  이메일
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  부서
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  권한
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  상태
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  최근 접속
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usersLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    등록된 계정이 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.departmentName ?? '-'}
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.lastAccessAt
                        ? formatDate(new Date(u.lastAccessAt))
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        basePath={basePath}
      />
    </div>
  );
}
