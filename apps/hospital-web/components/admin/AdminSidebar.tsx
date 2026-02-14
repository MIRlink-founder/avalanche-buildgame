'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Building2,
  LayoutDashboard,
  BarChart3,
  Receipt,
  Wallet,
  Package,
  Settings,
  MoreVertical,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Badge,
} from '@mire/ui';

const menuItems = [
  {
    title: '홈',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    title: '병원 관리',
    icon: Building2,
    href: '/admin/hospitals',
  },
  {
    title: '데이터 통계',
    icon: BarChart3,
    href: '/admin/statistics',
  },
  {
    title: '정산 관리',
    icon: Receipt,
    href: '/admin/settlements',
  },
  {
    title: '지갑 관리',
    icon: Wallet,
    href: '/admin/wallet',
  },
  {
    title: '물품 관리',
    icon: Package,
    href: '/admin/items',
  },
  {
    title: '시스템 설정',
    icon: Settings,
    href: '/admin/systems',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  // TODO: 실제 로그인한 담당자 정보로 대체
  const managerInfo = {
    badge: '운영사',
    name: '관리자',
    email: 'admin@mirelink.com',
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin">
          <Image
            src="/assets/Logo.svg"
            alt="MI;Re Logo"
            width={120}
            height={30}
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarGroupContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  size="lg"
                  className="text-base"
                >
                  <Link href={item.href} className="h-12">
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {managerInfo.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{managerInfo.name}</span>
              <span className="text-xs text-muted-foreground">
                {managerInfo.email}
              </span>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center"
            aria-label="더보기"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
