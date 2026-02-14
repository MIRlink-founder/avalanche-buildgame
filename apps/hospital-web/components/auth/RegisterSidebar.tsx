"use client"

import { Separator } from "@mire/ui/components/separator"
import { AlertTriangle, Lightbulb } from "lucide-react"

export function RegisterSidebar() {
  return (
    <aside className="sticky top-20 hidden h-fit max-h-[calc(100vh-5rem)] w-[500px] overflow-y-auto p-8 lg:block">
      <div className="space-y-8">
        {/* 입장 신청 가이드 */}
        <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <h3 className="text-lg font-semibold">입장 신청 가이드</h3>
          </div>
          <Separator />
          <div className="space-y-4">
            <div>
              <p className="mb-1 font-medium">Q. 아이디는 무엇인가요?</p>
              <p>입력하신 이메일이 승인 후 마스터 계정 ID가 됩니다.</p>
            </div>
            <div>
              <p className="mb-1 font-medium">Q. 심사 기간은?</p>
              <p>영업일 기준 1~3일 소요됩니다.</p>
            </div>
          </div>
        </div>

        {/* 서류 업로드 체크포인트 */}
        <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">서류 업로드 체크포인트</h3>
          </div>
          <Separator />
          <div className="space-y-4">
            <div>
              <p className="mb-1 font-medium">1. 의료기관 개설신고필증</p>
              <p>'진료과목: 치과' 혹은 병원종류가 명확히 식별되어야 합니다.</p>
            </div>
            <div>
              <p className="mb-1 font-medium">2. 개인정보 마스킹</p>
              <p>주민등록번호 뒷자리는 반드시 가리고 (Masking) 올려주세요.</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
