'use client';

import Link from 'next/link';
import { Button } from '@mire/ui/components/button';

export function SettingsAccountsPanel() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">계정 및 권한</h2>
        <p className="text-muted-foreground text-sm">
          계정 보안 설정과 권한 관리를 진행합니다.
        </p>
      </section>

      <section className="rounded-lg border bg-card px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">비밀번호 재설정</p>
            <p className="text-muted-foreground text-xs">
              재설정 링크를 메일로 받아 비밀번호를 변경합니다.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/auth/reset-password">재설정하기</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-muted/30 px-4 py-4">
        <p className="text-muted-foreground text-sm">
          계정 권한 관리 기능은 준비 중입니다.
        </p>
      </section>
    </div>
  );
}
