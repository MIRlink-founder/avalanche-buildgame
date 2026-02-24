'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@mire/ui/components/button';
import { cn } from '@mire/ui';
import { getPayloadFromToken } from '@/lib/decode-token';
import { ChevronDown } from 'lucide-react';

const HOSPITAL_MENU_PATHS = [
  '/dashboard',
  '/records',
  '/settlements',
  '/reports',
  '/support',
  '/settings',
];

function isHospitalMenuPath(pathname: string): boolean {
  return HOSPITAL_MENU_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const showLogin =
    pathname === '/' || (pathname?.startsWith('/auth') ?? false);
  const showMenu =
    pathname != null && !showLogin && isHospitalMenuPath(pathname);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    const payload = token ? getPayloadFromToken(token) : null;
    setUserName(payload?.name ?? null);
  }, [pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      router.push('/');
    }
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={showMenu ? '/dashboard' : '/'} className="shrink-0">
          <Image
            src="/assets/Logo.svg"
            alt="Mirlink Logo"
            width={120}
            height={40}
            priority
          />
        </Link>

        {showMenu ? (
          <div className="flex items-center gap-1">
            <NavLink href="/dashboard" current={pathname === '/dashboard'}>
              대시보드
            </NavLink>
            <NavLink href="/settlements" current={pathname === '/settlements'}>
              정산 관리
            </NavLink>
            <NavLink href="/reports" current={pathname === '/reports'}>
              데이터 리포트
            </NavLink>
            <NavLink href="/support" current={pathname === '/support'}>
              고객지원
            </NavLink>
            <NavLink href="/settings" current={pathname === '/settings'}>
              설정
            </NavLink>
            <div className="relative ml-4" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="xl"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="text-foreground hover:text-primary hover:bg-transparent"
              >
                {userName ?? '사용자'}님
                <ChevronDown
                  className={cn(
                    'ml-1 h-4 w-4 transition-transform',
                    userMenuOpen && 'rotate-180',
                  )}
                />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[10rem] rounded-md border bg-popover py-1 shadow-md">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link href="/">
            <Button variant="ghost" size="xl">
              로그인
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        size="xl"
        className={cn(
          current && 'font-medium text-primary',
          'hover:bg-transparent hover:text-primary',
        )}
      >
        {children}
      </Button>
    </Link>
  );
}
