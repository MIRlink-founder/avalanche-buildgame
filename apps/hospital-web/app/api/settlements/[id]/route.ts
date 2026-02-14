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
    const settlementId = getPositiveInt(id)

    if (!settlementId) {
      return NextResponse.json(
        { error: "정산 ID 형식이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includePayments = searchParams.get("includePayments") === "true"
    const includeTransfers = searchParams.get("includeTransfers") === "true"

    const include: Record<string, unknown> = {}

    if (includePayments) {
      include.payments = {
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
      }
    }

    if (includeTransfers) {
      include.bankTransfers = {
        select: {
          id: true,
          settlementId: true,
          amount: true,
          accountNumber: true,
          bankName: true,
          transferStatus: true,
          transferResult: true,
          transferredAt: true,
          createdAt: true,
        },
      }
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      ...(Object.keys(include).length > 0 ? { include } : {}),
    })

    if (!settlement) {
      return NextResponse.json(
        { error: "정산 정보를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    assertHospitalAccess(user, settlement.hospitalId)

    return NextResponse.json({ data: settlement })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("정산 상세 조회 오류:", error)
    return NextResponse.json(
      { error: "정산 상세 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
