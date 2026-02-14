"use client"

import Navigation from "@/components/layout/Navigation"
import Footer from "@/components/layout/Footer"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { RegisterSidebar } from "@/components/auth/RegisterSidebar"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 상단 네비게이션 - 고정 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <main className="flex flex-1 pt-20">
        {/* 좌측 입력 폼 - 스크롤 가능 */}
        <div className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <RegisterForm />
          </div>
        </div>

        {/* 우측 고정 패널 */}
        <RegisterSidebar />
      </main>

      {/* 하단 푸터 */}
      <Footer />
    </div>
  )
}
