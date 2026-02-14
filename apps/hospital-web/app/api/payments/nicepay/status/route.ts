import { NextResponse } from "next/server"
import { requestNicepayStatus } from "@/lib/nicepay/nicepay-client"
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

    if (!tid) {
      return NextResponse.json(
        { error: "거래 번호가 필요합니다" },
        { status: 400 }
      )
    }

    const result = await requestNicepayStatus({ tid })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("NICEPAY 조회 오류:", error)
    return NextResponse.json(
      { error: "나이스페이 조회 요청에 실패했습니다" },
      { status: 500 }
    )
  }
}
