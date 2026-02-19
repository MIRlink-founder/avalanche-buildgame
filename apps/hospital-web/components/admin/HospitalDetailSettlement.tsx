'use client';

import type { HospitalDetail } from '@/lib/admin-hospital-types';

interface HospitalDetailSettlementProps {
  hospital: HospitalDetail;
  onRefresh: () => void;
}

export function HospitalDetailSettlement({ hospital, onRefresh }: HospitalDetailSettlementProps) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
      준비 중입니다.
    </div>
  );
}
