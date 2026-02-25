import Footer from '@/components/layout/Footer';
import Navigation from '@/components/layout/Navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { RecordsSessionClearOnLeave } from '@/components/records/RecordsSessionClearOnLeave';

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard mode="hospital">
      <RecordsSessionClearOnLeave />
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20">{children}</div>
      </div>
    </RoleGuard>
  );
}
