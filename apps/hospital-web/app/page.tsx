"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { OnboardingCarousel } from "@/components/home/OnboardingCarousel"
import { LoginForm } from "@/components/home/LoginForm"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      router.replace("/dashboard")
    }
  }, [router])

  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 - 메인 배너 이미지  */}
      <div className="hidden p-8 lg:flex lg:w-1/2">
        <OnboardingCarousel />
      </div>

      {/* 오른쪽 - 로그인 */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* 로고 */}
          <div className="space-y-2 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Image
                src="/assets/Logo.svg"
                alt="MI;Re Logo"
                width={200}
                height={40}
                priority
              />
            </div>
          </div>
          {/* 로그인 폼 */}
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
