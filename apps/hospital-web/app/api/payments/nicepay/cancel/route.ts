import { NextResponse } from "next/server"
import { requestNicepayCancel } from "@/lib/nicepay/nicepay-client"
import { AuthError, requireAuth } from "@/lib/auth-guard"

export const runtime = "nodejs"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  try {
    await requireAuth(request)
    const body = await request.json().catch(() => null)

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "요청 데이터 형식이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const tid = getString(body.tid)
    const moid = getString(body.moid)
    const cancelMessage = getString(body.cancelMessage)
    const partialCancelCode = getString(body.partialCancelCode) as "0" | "1"
    const cancelAmount = body.cancelAmount

    if (!tid || !moid || !cancelMessage || !partialCancelCode) {
      return NextResponse.json(
        { error: "필수 취소 값이 누락되었습니다" },
        { status: 400 }
      )
    }

    if (partialCancelCode !== "0" && partialCancelCode !== "1") {
      return NextResponse.json(
        { error: "부분 취소 코드가 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const result = await requestNicepayCancel({
      tid,
      moid,
      cancelAmount: cancelAmount as number | string,
      cancelMessage,
      partialCancelCode,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("NICEPAY 취소 오류:", error)
    return NextResponse.json(
      { error: "나이스페이 취소 요청에 실패했습니다" },
      { status: 500 }
    )
  }
}
