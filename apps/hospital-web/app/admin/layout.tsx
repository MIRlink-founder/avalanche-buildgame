import { SidebarProvider, SidebarInset } from '@mire/ui';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard mode="admin">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
