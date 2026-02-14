import { NextResponse } from "next/server"
import { prisma } from "@mire/database"
import { AuthError, assertHospitalAccess, requireAuth } from "@/lib/auth-guard"

export const runtime = "nodejs"

function getPositiveInt(value: string) {
  if (!/^[0-9]+$/.test(value.trim())) {
    return null
  }
  const parsed = Number.parseInt(value.trim(), 10)
  return parsed > 0 ? parsed : null
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await context.params
    const paymentId = getPositiveInt(id)

    if (!paymentId) {
      return NextResponse.json(
        { error: "결제 ID 형식이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        medicalRecordId: true,
        hospitalId: true,
        settlementId: true,
        subMid: true,
        approveNo: true,
        pgTransactionId: true,
        amount: true,
        paymentMethod: true,
        status: true,
        paidAt: true,
        cancelledAt: true,
        createdAt: true,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    assertHospitalAccess(user, payment.hospitalId)

    return NextResponse.json({ data: payment })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("결제 상세 조회 오류:", error)
    return NextResponse.json(
      { error: "결제 상세 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
