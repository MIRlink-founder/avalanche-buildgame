'use client';

import { useEffect, useState } from 'react';
import { ResetPasswordRequestPanel } from '@/components/auth/ResetPasswordRequestPanel';
import { Input } from '@mire/ui';
import { Label } from '@mire/ui';
import { ACCOUNT_ROLE_LABELS } from '@/lib/admin-hospital-format';
import { getAuthHeaders, redirectIfUnauthorized } from '@/lib/get-auth-headers';

type ProfileResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  hospital: {
    id: string;
    name: string;
  };
};

export function SettingsAccountsPanel() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          </div>
        ) : null}
      </section>
    </div>
  );
}
