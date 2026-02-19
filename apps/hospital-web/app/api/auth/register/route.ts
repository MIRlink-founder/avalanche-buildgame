import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@mire/database"

export async function POST(request: Request) {
  try {
    const { email, name, hospitalName, businessNumber } = await request.json()

    if (!email || !name || !hospitalName || !businessNumber) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요" },
        { status: 400 }
      )
    }

    // 중복 이메일 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다" },
        { status: 400 }
      )
    }

    // 중복 병원 체크
    const existingHospital = await prisma.hospital.findUnique({
      where: { businessNumber },
    })
    if (existingHospital) {
      return NextResponse.json(
        { error: "이미 등록된 사업자등록번호입니다" },
        { status: 400 }
      )
    }

    // 병원 생성
    const result = await prisma.$transaction(async (tx: any) => {
      const hospital = await tx.hospital.create({
        data: {
          // TODO: required 정책에 맞추기
          managerName: name,
          managerEmail: email,
          businessNumber: businessNumber,
          officialName: hospitalName,
          ceoName: "",
          businessAddress: "",
          type: "GENERAL",
          status: "PENDING",
        },
      })

      // 등록 요청 생성 (심사 이력용, 상태는 Hospital.status 로 관리)
      await tx.registrationRequest.create({
        data: {
          hospitalId: hospital.id,
        },
      })

      return { hospital }
    })

    return NextResponse.json({
      success: true,
      hospital: result.hospital,
      message:
        "회원가입이 완료되었습니다. 관리자 승인 후 이용하실 수 있습니다.",
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
