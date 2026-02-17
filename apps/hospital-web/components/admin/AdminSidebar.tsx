'use client';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { adminMenuItems } from '@/components/layout/menu-items';

export function AdminSidebar() {
  return <AppSidebar menuItems={adminMenuItems} logoHref="/admin" />;
}
