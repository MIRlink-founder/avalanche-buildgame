'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/layout/Tabs';
import { SettingsBasicForm } from '@/components/settings/SettingsBasicForm';

const SETTINGS_TABS = [
  { id: 'basic', label: '기본 정보' },
  { id: 'accounts', label: '계정 및 권한' },
  { id: 'items', label: '기기 관리' },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') ?? SETTINGS_TABS[0]?.id ?? 'basic';

  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center bg-background px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">설정</h1>
        </div>
      </header>

      <div className="p-6 lg:px-8">
        <Tabs tabs={SETTINGS_TABS} basePath="/settings" defaultTab="basic" />

        <div className="mt-6">
          {currentTab === 'basic' && <SettingsBasicForm />}
          {currentTab === 'accounts' && (
            <p className="text-muted-foreground">준비 중입니다.</p>
          )}
          {currentTab === 'items' && (
            <p className="text-muted-foreground">준비 중입니다.</p>
          )}
        </div>
      </div>
    </>
  );
}
