'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@mire/ui';

const tabs = [
  { id: 'all', label: '전체' },
  { id: 'active', label: '정상' },
  { id: 'suspended', label: '정지/탈퇴' },
  { id: 'pending', label: '심사' },
] as const;

export function HospitalTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    params.delete('page'); // 탭 변경 시 첫 페이지로
    params.delete('search'); // 탭 변경 시 검색어 초기화
    router.push(`/admin/hospitals?${params.toString()}`);
  };

  return (
    <div className="border-b">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'border-b-2 px-8 pb-4 font-medium transition-colors',
              currentTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
