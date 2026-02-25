import { NextResponse } from "next/server"
import { approveV1Payment } from "@/lib/nicepay/nicepay-v1-client"

export const runtime = "nodejs"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number(value.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * NicePay JS SDK 결제창 인증 완료 후 서버 사이드 승인 처리
 *
 * POST /api/payments/nicepay/approve
 * Body: { tid, authResultCode, authResultMsg, amount, orderId, signature? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "요청 데이터 형식이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const tid = getString(body.tid)
    const authResultCode = getString(body.authResultCode)
    const authResultMsg = getString(body.authResultMsg)
    const amount = getNumber(body.amount)
    const orderId = getString(body.orderId)

    if (!tid || !orderId || amount === null) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다 (tid, orderId, amount)" },
        { status: 400 }
      )
    }

    // JS SDK 인증 결과 검증
    if (authResultCode !== "0000") {
      return NextResponse.json(
        {
          success: false,
          error: `결제 인증 실패: [${authResultCode}] ${authResultMsg}`,
        },
        { status: 400 }
      )
    }

    // 서버 사이드 결제 승인 요청
    const result = await approveV1Payment({ tid, amount, orderId })

    return NextResponse.json({
      success: true,
      resultCode: result.resultCode,
      resultMsg: result.resultMsg,
      tid: result.tid,
      orderId: result.orderId,
      amount: result.amount,
      approveNo: result.approveNo,
      paidAt: result.paidAt,
    })
  } catch (error) {
    console.error("NicePay v1 결제 승인 오류:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "결제 승인 처리 중 오류가 발생했습니다",
      },
      { status: 500 }
    )
  }
}
