import { NextResponse } from "next/server"
import { prisma } from "@mire/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessNumber = searchParams.get("businessNumber")

    if (!businessNumber) {
      return NextResponse.json(
        { error: "사업자등록번호를 입력해주세요" },
        { status: 400 }
      )
    }

    // 사업자번호 형식 검증 (000-00-00000)
    const businessRegex = /^\d{3}-\d{2}-\d{5}$/
    if (!businessRegex.test(businessNumber)) {
      return NextResponse.json(
        { error: "사업자등록번호 형식이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    // DB에서 중복 확인
    const existingHospital = await prisma.hospital.findUnique({
      where: { businessNumber },
    })

    // TODO: 국제청 API (계속사업자 여부 확인)

    return NextResponse.json({
      exists: !!existingHospital,
    })
  } catch (error) {
    console.error("Check business error:", error)
    return NextResponse.json(
      { error: "사업자번호 확인 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
