import { NextResponse } from "next/server"
import { prisma } from "@mire/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요" },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    return NextResponse.json({
      exists: !!existingUser,
    })
  } catch (error) {
    console.error("Check email error:", error)
    return NextResponse.json(
      { error: "이메일 확인 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
