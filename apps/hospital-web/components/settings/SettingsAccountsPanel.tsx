'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ResetPasswordRequestPanel } from '@/components/auth/ResetPasswordRequestPanel';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@mire/ui';
import { ACCOUNT_ROLE_LABELS } from '@/lib/admin-hospital-format';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';

type ProfileResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentName?: string | null;
  };
  hospital: {
    id: string;
    name: string;
  };
};

export function SettingsAccountsPanel() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawSuccessOpen, setWithdrawSuccessOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch('/api/settings/profile', { headers: getAuthHeaders() })
      .then((res) => {
        if (redirectIfUnauthorized(res)) return null;
        if (!res.ok) throw new Error('내 계정 정보를 불러오지 못했습니다.');
        return res.json();
      })
      .then((data: ProfileResponse | null) => {
        if (!cancelled && data) {
          setProfile(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || '내 계정 정보를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    setWithdrawError('');

    try {
      const res = await fetch('/api/settings/withdraw', {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      });
      if (redirectIfUnauthorized(res)) return;
      const result = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setWithdrawError(result.error || '탈퇴 처리에 실패했습니다.');
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      setWithdrawConfirmOpen(false);
      setWithdrawSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setWithdrawError('탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">계정 및 권한</h2>
        <p className="text-muted-foreground text-sm">
          계정 보안 설정과 권한 관리를 진행합니다.
        </p>
      </section>

      <section className="space-y-6 rounded-lg border bg-card p-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">내 계정</h3>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : profile ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">이름</Label>
              <Input
                id="account-name"
                value={profile.user.name}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-hospital">소속 병원</Label>
              <Input
                id="account-hospital"
                value={profile.hospital.name}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-department">부서</Label>
              <Input
                id="account-department"
                value={profile.user.departmentName ?? '-'}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-role">권한</Label>
              <Input
                id="account-role"
                value={
                  ACCOUNT_ROLE_LABELS[profile.user.role] ?? profile.user.role
                }
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <div className="space-y-2 md:w-1/3 md:max-w-[360px] md:flex-none">
                <Label htmlFor="account-email">로그인 계정</Label>
                <Input
                  id="account-email"
                  value={profile.user.email}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">비밀번호 재설정</p>
                <ResetPasswordRequestPanel
                  variant="embedded"
                  showTitle={false}
                  showFootnote={false}
                  buttonFullWidth={false}
                  inlineMessage="설정된 이메일로 재설정 링크가 발송됩니다."
                />
              </div>
            </div>
            <div className="border-t pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">계정 탈퇴</p>
                  <p className="text-muted-foreground text-xs">
                    탈퇴 시 계정은 비활성화되며 복구할 수 없습니다.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setWithdrawConfirmOpen(true)}
                  disabled={withdrawLoading}
                >
                  {withdrawLoading ? '탈퇴 처리 중...' : '탈퇴하기'}
                </Button>
              </div>
              {withdrawError && (
                <p className="text-sm text-destructive">{withdrawError}</p>
              )}
            </div>
          </div>
        ) : null}
      </section>
      <Dialog open={withdrawConfirmOpen} onOpenChange={setWithdrawConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계정 탈퇴</DialogTitle>
            <DialogDescription>
              탈퇴하면 계정을 복구할 수 없습니다. 탈퇴하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWithdrawConfirmOpen(false)}
              disabled={withdrawLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleWithdraw}
              disabled={withdrawLoading}
            >
              {withdrawLoading ? '처리 중...' : '탈퇴하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={withdrawSuccessOpen} onOpenChange={setWithdrawSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>탈퇴 완료</DialogTitle>
            <DialogDescription>
              탈퇴 처리가 완료되었습니다. 로그인 화면으로 이동합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setWithdrawSuccessOpen(false);
                router.push('/');
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
