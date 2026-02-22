'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { hospitalMenuItems } from '@/components/layout/menu-items';
import { getPayloadFromToken } from '@/lib/decode-token';

export function HospitalSidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    const payload = token ? getPayloadFromToken(token) : null;
    setUserRole(payload?.role ?? null);
  }, []);

  const menuItems = useMemo(() => {
    if (userRole === 'MASTER_ADMIN') return hospitalMenuItems;
    return hospitalMenuItems.filter((item) => item.href !== '/hospital/staff');
  }, [userRole]);

  return <AppSidebar menuItems={menuItems} logoHref="/dashboard" />;
}
