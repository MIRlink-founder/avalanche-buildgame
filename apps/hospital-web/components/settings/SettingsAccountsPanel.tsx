'use client';

import { ResetPasswordRequestPanel } from '@/components/auth/ResetPasswordRequestPanel';

export function SettingsAccountsPanel() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">계정 및 권한</h2>
        <p className="text-muted-foreground text-sm">
          계정 보안 설정과 권한 관리를 진행합니다.
        </p>
      </section>

      <ResetPasswordRequestPanel />

      <section className="rounded-lg border bg-muted/30 px-4 py-4">
        <p className="text-muted-foreground text-sm">
          계정 권한 관리 기능은 준비 중입니다.
        </p>
      </section>
    </div>
  );
}
