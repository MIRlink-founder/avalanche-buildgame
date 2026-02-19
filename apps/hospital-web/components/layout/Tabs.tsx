'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@mire/ui';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  /** 탭 목록 */
  tabs: TabItem[];
  /** 탭 클릭 시 이동할 URL 경로 (쿼리 제외) */
  basePath: string;
  /** URL 쿼리 파라미터 이름 (기본: 'tab') */
  paramName?: string;
  /** 기본 선택 탭 id (미지정 시 tabs[0].id) */
  defaultTab?: string;
  /** true면 page/search 등 기존 쿼리 유지 (상세 페이지에서 목록 복귀용) */
  preserveParams?: boolean;
}

export function Tabs({
  tabs,
  basePath,
  paramName = 'tab',
  defaultTab,
  preserveParams = false,
}: TabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab =
    (searchParams.get(paramName) || defaultTab) ?? tabs[0]?.id ?? '';

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, tabId);
    if (!preserveParams) {
      params.delete('page');
      params.delete('search');
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="border-b">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
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
