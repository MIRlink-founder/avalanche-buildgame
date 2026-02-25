'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/layout/Tabs';
import { SettingsBasicForm } from '@/components/settings/SettingsBasicForm';
import { SettingsAccountsPanel } from '@/components/settings/SettingsAccountsPanel';
import { HospitalStaffPanel } from '@/components/settings/HospitalStaffPanel';
import { getPayloadFromToken } from '@/lib/decode-token';

const SETTINGS_TABS = [
  { id: 'basic', label: '기본 정보' },
  { id: 'accounts', label: '계정 및 권한' },
  { id: 'items', label: '기기 관리' },
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentRole, setCurrentRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const payload = token ? getPayloadFromToken(token) : null;
    setCurrentRole(payload?.role ?? '');
  }, []);

  const availableTabs = useMemo(() => {
    if (currentRole === 'MASTER_ADMIN') return SETTINGS_TABS;
    return SETTINGS_TABS.filter((tab) => tab.id === 'accounts');
  }, [currentRole]);
  const fallbackTab = availableTabs[0]?.id ?? 'accounts';
  const currentTab = searchParams.get('tab') ?? fallbackTab;
  const hasValidTab = availableTabs.some((tab) => tab.id === currentTab);
  const activeTab = hasValidTab ? currentTab : fallbackTab;

  useEffect(() => {
    if (!hasValidTab) {
      router.replace(`/settings?tab=${fallbackTab}`);
    }
  }, [fallbackTab, hasValidTab, router]);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center bg-background px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">계정 및 권한 관리</h1>
        </div>
      </header>

      <div className="p-6 lg:px-8">
        <Tabs
          tabs={availableTabs}
          basePath="/settings"
          defaultTab={fallbackTab}
        />

        <div className="mt-6">
          {activeTab === 'basic' && <SettingsBasicForm />}
          {activeTab === 'accounts' && (
            currentRole === 'MASTER_ADMIN'
              ? <HospitalStaffPanel basePath="/settings" tabParamName="staffTab" />
              : <SettingsAccountsPanel />
          )}
          {activeTab === 'items' && (
            <p className="text-muted-foreground">준비 중입니다.</p>
          )}
        </div>
      </div>
    </>
  );
}
