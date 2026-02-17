'use client';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { hospitalMenuItems } from '@/components/layout/menu-items';

export function HospitalSidebar() {
  return <AppSidebar menuItems={hospitalMenuItems} logoHref="/dashboard" />;
}
