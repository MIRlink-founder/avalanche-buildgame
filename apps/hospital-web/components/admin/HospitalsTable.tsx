'use client';

import { useState } from 'react';
import { Badge } from '@mire/ui';
import { Button } from '@mire/ui';
import {
  formatDate,
  formatBusinessNumber,
  formatPhone,
  HOSPITAL_STATUS_LABELS,
  HOSPITAL_STATUS_COLORS,
} from '@/lib/admin-hospital-format';
import { HospitalReviewDrawer } from './HospitalReviewDrawer';

interface Hospital {
  id: string;
  officialName: string;
  displayName: string | null;
  ceoName: string;
  businessNumber: string;
  managerPhone: string | null;
  createdAt: Date;
  /** 계정 생성일 (해당 병원 User 최초 생성일, 전체/정상/정지·탈퇴 탭용) */
  accountCreatedAt?: Date | null;
  status: string;
}

interface HospitalsTableProps {
  hospitals: Hospital[];
  /** true면 계정 생성일, false면 가입 신청일 컬럼 표시 */
  showAccountCreatedAt?: boolean;
}

export function HospitalsTable({
  hospitals,
  showAccountCreatedAt = false,
}: HospitalsTableProps) {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (hospital: Hospital) => {
    setSelectedHospitalId(hospital.id);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedHospitalId(null);
  };

  const handleManagementButtonClick = (
    e: React.MouseEvent,
    hospital: Hospital,
  ) => {
    e.stopPropagation();
    openDrawer(hospital);
  };

  return (
    <>
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  병원명
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  대표자
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  사업자 번호
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  연락처
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {showAccountCreatedAt ? '계정 생성일' : '가입 신청일'}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  상태
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hospitals.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    등록된 병원이 없습니다.
                  </td>
                </tr>
              ) : (
                hospitals.map((hospital) => {
                  const status = hospital.status;
                  const isPending = status === 'PENDING';

                  return (
                    <tr key={hospital.id}>
                      <td className="px-4 py-3">
                        {hospital.displayName || hospital.officialName}
                      </td>
                      <td className="px-4 py-3">{hospital.ceoName}</td>
                      <td className="px-4 py-3 font-mono">
                        {formatBusinessNumber(hospital.businessNumber)}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatPhone(hospital.managerPhone)}
                      </td>
                      <td className="px-4 py-3">
                        {showAccountCreatedAt
                          ? hospital.accountCreatedAt
                            ? formatDate(hospital.accountCreatedAt)
                            : '-'
                          : formatDate(hospital.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={HOSPITAL_STATUS_COLORS[status]}>
                          {HOSPITAL_STATUS_LABELS[status] || status}
                        </Badge>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPending ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) =>
                              handleManagementButtonClick(e, hospital)
                            }
                          >
                            승인 심사
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              if (
                                hospital.status === 'PENDING' ||
                                hospital.status === 'APPROVED' ||
                                hospital.status === 'REJECTED'
                              ) {
                                handleManagementButtonClick(e, hospital);
                              } else if (
                                hospital.status === 'ACTIVE' ||
                                hospital.status === 'DISABLED' ||
                                hospital.status === 'WITHDRAWN'
                              ) {
                                window.location.href = `/admin/hospitals/${hospital.id}`;
                              }
                            }}
                          >
                            상세
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HospitalReviewDrawer
        hospitalId={selectedHospitalId}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
      />
    </>
  );
}
