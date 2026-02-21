import {
  Building2,
  LayoutDashboard,
  BarChart3,
  Receipt,
  Wallet,
  Package,
  User,
  Settings,
  Users2,
  CalendarCheck2,
  NotebookPen,
} from 'lucide-react';
import type { SidebarMenuItem } from './AppSidebar';

// 운영사 Admin 사이드바 메뉴
export const adminMenuItems: SidebarMenuItem[] = [
  { title: '병원 관리', icon: Building2, href: '/admin/hospitals' },
  { title: '데이터 통계', icon: BarChart3, href: '/admin/statistics' },
  { title: '정산 관리', icon: Receipt, href: '/admin/settlements' },
  { title: '지갑 관리', icon: Wallet, href: '/admin/wallet' },
  { title: 'AS 관리', icon: Package, href: '/admin/items' },
  { title: '내 계정', icon: User, href: '/admin/account' },
  { title: '시스템 설정', icon: Settings, href: '/admin/systems' },
];

// 병원 Admin 사이드바 메뉴
export const hospitalMenuItems: SidebarMenuItem[] = [
  { title: '대시보드', icon: LayoutDashboard, href: '/dashboard' },
  { title: '환자 관리', icon: Users2, href: '/patients' },
  { title: '예약 관리', icon: CalendarCheck2, href: '/appointments' },
  { title: '진료 기록', icon: NotebookPen, href: '/records' },
  { title: '재고 관리', icon: Package, href: '/inventories' },
  { title: '설정', icon: Settings, href: '/settings' },
];
