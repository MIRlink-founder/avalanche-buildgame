import { NextResponse } from "next/server"
import { requestPaymentStatus } from "@/lib/payments/payment-service"
import { AuthError, assertHospitalAccess, requireAuth } from "@/lib/auth-guard"

export const runtime = "nodejs"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function getMetadata(value: unknown) {
  if (!isRecord(value)) {
    return undefined
  }

  const entries = Object.entries(value).filter(
    ([, entryValue]) => typeof entryValue === "string"
  ) as Array<[string, string]>

  return Object.fromEntries(entries)
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request)
    const body = await request.json().catch(() => null)

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "요청 데이터 형식이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const orderId = getString(body.orderId)
    const providerTransactionId = getString(body.providerTransactionId)
    const approvalCode = getString(body.approvalCode)
    const subMerchantId = getString(body.subMerchantId)
    const metadata = getMetadata(body.metadata)
    const hospitalId = getString(body.hospitalId)

    if (!orderId && !providerTransactionId && !approvalCode) {
      return NextResponse.json(
        { error: "조회 조건이 필요합니다" },
        { status: 400 }
      )
    }

    if (hospitalId) {
      assertHospitalAccess(user, hospitalId)
    } else if (user.hospitalId) {
      return NextResponse.json(
        { error: "병원 ID가 필요합니다" },
        { status: 400 }
      )
    }

    const result = await requestPaymentStatus({
      orderId: orderId || undefined,
      providerTransactionId: providerTransactionId || undefined,
      approvalCode: approvalCode || undefined,
      subMerchantId: subMerchantId || undefined,
      metadata,
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("결제 상태 조회 오류:", error)
    return NextResponse.json(
      { error: "결제 상태 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
