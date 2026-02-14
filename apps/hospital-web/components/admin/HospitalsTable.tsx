'use client';

import { useState } from 'react';
import { Badge } from '@mire/ui';
import { Button } from '@mire/ui';
import {
  HospitalReviewDrawer,
  type HospitalForDrawer,
} from './HospitalReviewDrawer';

interface Hospital {
  id: string;
  officialName: string;
  displayName: string | null;
  ceoName: string;
  businessNumber: string;
  managerPhone: string | null;
  createdAt: Date;
  status: string;
  registrationRequests: Array<{
    status: string;
    createdAt: Date;
  }>;
}

interface HospitalsTableProps {
  hospitals: Hospital[];
}

const statusLabels: Record<string, string> = {
  PENDING: '승인대기',
  APPROVED: '승인완료',
  ACTIVE: '승인완료',
  REJECTED: '반려',
  DISABLED: '정지',
  WITHDRAWN: '탈퇴',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  APPROVED: 'bg-green-100 text-green-800 hover:bg-green-100',
  ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100',
  REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
  DISABLED: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  WITHDRAWN: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

export function HospitalsTable({ hospitals }: HospitalsTableProps) {
  const [selectedHospital, setSelectedHospital] =
    useState<HospitalForDrawer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (hospital: Hospital) => {
    setSelectedHospital(hospital as HospitalForDrawer);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedHospital(null);
  };

  const handleManagementButtonClick = (
    e: React.MouseEvent,
    hospital: Hospital,
  ) => {
    e.stopPropagation();
    openDrawer(hospital);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBusinessNumber = (num: string) => {
    // 123-45-67890 형식으로 변환
    if (num.length === 10) {
      return `${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
    }
    return num;
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    // 02-1234-5678 형식으로 변환
    if (phone.startsWith('02')) {
      if (phone.length === 9) {
        return `${phone.slice(0, 2)}-${phone.slice(2, 5)}-${phone.slice(5)}`;
      }
      return `${phone.slice(0, 2)}-${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    // 010-1234-5678 형식
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  };

  const getHospitalStatus = (hospital: Hospital) => {
    const latestRequest = hospital.registrationRequests[0];
    if (latestRequest && latestRequest.status === 'PENDING') {
      return 'PENDING';
    }
    return hospital.status;
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
                  가입 신청일
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
                  const status = getHospitalStatus(hospital);
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
                        {formatDate(hospital.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[status]}>
                          {statusLabels[status] || status}
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
                            onClick={(e) =>
                              handleManagementButtonClick(e, hospital)
                            }
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
        hospital={selectedHospital}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
      />
    </>
  );
}
