// 병원 관리(admin) 상세 조회용 타입 (API 응답 및 클라이언트 공통)

export interface HospitalDocument {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
}

export interface HospitalMemo {
  id: string;
  content: string;
  createdAt: string;
}

export interface HospitalDetail {
  id: string;
  officialName: string;
  displayName: string | null;
  ceoName: string;
  businessNumber: string;
  managerPhone: string | null;
  managerEmail: string | null;
  businessAddress: string | null;
  createdAt: string;
  accountCreatedAt: string | null;
  withdrawalDate: string | null;
  status: string;
  paybackRate: string | null;
  paybackRateUpdatedAt: string | null;
  documents: HospitalDocument[];
  memos: HospitalMemo[];
}
