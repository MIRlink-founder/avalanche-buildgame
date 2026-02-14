import { NextResponse } from "next/server"
import { requestNicepayCardKeyin } from "@/lib/nicepay/nicepay-client"
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

    const moid = getString(body.moid)
    const goodsName = getString(body.goodsName)
    const cardNo = getString(body.cardNo)
    const cardExpire = getString(body.cardExpire)
    const cardInterest = getString(body.cardInterest) as "0" | "1"
    const cardQuota = getString(body.cardQuota)
    const buyerAuthNum = getString(body.buyerAuthNum)
    const cardPwd = getString(body.cardPwd)
    const buyerEmail = getString(body.buyerEmail)
    const buyerTel = getString(body.buyerTel)
    const buyerName = getString(body.buyerName)

    const amount = body.amount

    if (!moid || !goodsName || !cardNo || !cardExpire || !cardInterest) {
      return NextResponse.json(
        { error: "필수 결제 값이 누락되었습니다" },
        { status: 400 }
      )
    }

    if (cardInterest !== "0" && cardInterest !== "1") {
      return NextResponse.json(
        { error: "무이자 설정 값이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    if (!cardQuota) {
      return NextResponse.json(
        { error: "할부 개월 값이 누락되었습니다" },
        { status: 400 }
      )
    }

    const result = await requestNicepayCardKeyin({
      moid,
      amount: amount as number | string,
      goodsName,
      cardNo,
      cardExpire,
      buyerAuthNum: buyerAuthNum || undefined,
      cardPwd: cardPwd || undefined,
      cardInterest,
      cardQuota,
      buyerEmail: buyerEmail || undefined,
      buyerTel: buyerTel || undefined,
      buyerName: buyerName || undefined,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("NICEPAY 카드 키인 오류:", error)
    return NextResponse.json(
      { error: "나이스페이 결제 요청에 실패했습니다" },
      { status: 500 }
    )
  }
}
