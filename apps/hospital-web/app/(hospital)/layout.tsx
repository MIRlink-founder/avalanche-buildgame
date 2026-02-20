import Footer from '@/components/layout/Footer';
import Navigation from '@/components/layout/Navigation';

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20">{children}</div>
      <Footer />
    </div>
  );
}
