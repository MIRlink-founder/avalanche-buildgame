'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { MoreVertical, LogOut } from 'lucide-react';
import {
  Sidebar as UiSidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@mire/ui';
import { getPayloadFromToken } from '@/lib/decode-token';

export interface SidebarMenuItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

export interface AppSidebarProps {
  menuItems: SidebarMenuItem[];
  logoHref?: string;
}

const DEFAULT_USER = {
  name: '-',
  email: '-',
};

export function AppSidebar({
  menuItems,
  logoHref = '/admin',
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [userInfo, setUserInfo] = useState(DEFAULT_USER);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;
    if (!token) return;
    const payload = getPayloadFromToken(token);
    if (payload?.email) {
      setUserInfo({
        name: payload.name ?? DEFAULT_USER.name,
        email: payload.email,
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (!menuOpen) return;
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <UiSidebar>
      <SidebarHeader>
        <Link href={logoHref}>
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
              {userInfo.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userInfo.name}</span>
              <span className="text-xs text-muted-foreground">
                {userInfo.email}
              </span>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
              aria-label="더보기"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="z-100 absolute bottom-full mb-1 min-w-[140px] rounded-md border bg-popover py-1 shadow-md">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
    </UiSidebar>
  );
}
