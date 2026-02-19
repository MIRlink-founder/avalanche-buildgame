'use client';

import type { HospitalDetail } from '@/lib/admin-hospital-types';

interface HospitalDetailAsProps {
  hospital: HospitalDetail;
  onRefresh: () => void;
}

export function HospitalDetailAs({ hospital, onRefresh }: HospitalDetailAsProps) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
      준비 중입니다.
    </div>
  );
}
