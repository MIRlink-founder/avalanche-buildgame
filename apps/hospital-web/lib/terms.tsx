// 병원 회원가입 시 약관 내용
import { ReactNode } from "react"

export const TERMS_CONTENT = {
  serviceTerms: {
    title: "서비스 이용약관",
    content: (
      <div className="flex flex-col gap-4">
        <h3>제1조 (목적)</h3>
        <p className="text-sm">
          본 약관은 회사가 제공하는 환자 정보 관리 서비스(이하 "서비스")의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한
          사항을 규정함을 목적으로 합니다.
        </p>
        <h3>제2조 (정의)</h3>
        <p className="text-sm">
          1. "서비스"란 회사가 제공하는 환자 정보 관리 및 관련 부가 서비스를
          의미합니다.
        </p>
        <p className="text-sm">
          2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는
          의료기관 및 의료인을 말합니다.
        </p>
        <p className="text-sm">
          3. "회원"이란 회사와 서비스 이용계약을 체결하고 회사가 제공하는
          서비스를 이용하는 자를 말합니다.
        </p>
        <h3>제3조 (약관의 효력 및 변경)</h3>
        <p className="text-sm">
          1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을
          발생합니다.
        </p>
        <p className="text-sm">
          2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을
          변경할 수 있으며, 변경된 약관 은 공지사항을 통해 공지합니다.
        </p>
        <h3>제4조 (서비스의 제공)</h3>
        <p className="text-sm">회사는 다음과 같은 서비스를 제공합니다:</p>
        <p className="text-sm">1. 환자 정보 등록 및 관리 서비스</p>
        <p className="text-sm">2. 진료 기록 관리 서비스</p>
        <p className="text-sm">3. 예약 관리 서비스</p>
      </div>
    ),
  },
  privacyPolicy: {
    title: "개인정보 수집 및 이용",
    content: `미정`,
  },
  electronicFinance: {
    title: "전자금융거래 이용약관",
    content: `미정`,
  },
  thirdPartySharing: {
    title: "개인정보 제3자 제공",
    content: `미정`,
  },
} as const

export type TermsType = keyof typeof TERMS_CONTENT
