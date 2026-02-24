'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getPayloadFromToken } from '@/lib/decode-token';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SUB_ADMIN']);
const HOSPITAL_ROLES = new Set(['MASTER_ADMIN', 'DEPT_ADMIN']);

interface RoleGuardProps {
  mode: 'admin' | 'hospital';
  children: React.ReactNode;
}

export function RoleGuard({ mode, children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(false);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/');
      return;
    }

    const payload = getPayloadFromToken(token);
    const role = payload?.role;
    if (!role) {
      router.replace('/');
      return;
    }

    if (mode === 'admin') {
      if (ADMIN_ROLES.has(role)) {
        setAllowed(true);
        return;
      }
      if (HOSPITAL_ROLES.has(role)) {
        router.replace('/dashboard');
        return;
      }
      router.replace('/');
      return;
    }

    if (HOSPITAL_ROLES.has(role)) {
      setAllowed(true);
      return;
    }
    if (ADMIN_ROLES.has(role)) {
      router.replace('/admin/hospitals');
      return;
    }
    router.replace('/');
  }, [mode, router, pathname]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
