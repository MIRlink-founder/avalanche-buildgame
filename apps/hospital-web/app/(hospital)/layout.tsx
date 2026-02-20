import Navigation from '@/components/layout/Navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard mode="hospital">
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20">{children}</div>
      </div>
    </RoleGuard>
  );
}
