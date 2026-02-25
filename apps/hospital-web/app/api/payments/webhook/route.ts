import { NextResponse } from 'next/server'
import { prisma } from '@mire/database'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

/**
 * PG사(NicePay) Webhook 수신 → PaymentLog 단순 적재
 *
 * 시퀀스 다이어그램 Phase 3:
 * - PG → 서버 Webhook → 결제 로그 INSERT
 * - 진료 정보(MedicalRecord)와 매칭하지 않음
 */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function getString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Webhook 시그니처 검증 (HMAC-SHA256) */
function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex'),
  )
}

export async function POST(request: Request) {
  // 1. Webhook 시그니처 검증
  const webhookSecret = process.env.NICEPAY_WEBHOOK_SECRET
  const rawBody = await request.text()

  if (webhookSecret) {
    const signature = request.headers.get('x-nicepay-signature') ?? ''
    if (!signature) {
      return NextResponse.json(
        { error: 'Webhook 시그니처가 누락되었습니다.' },
        { status: 401 },
      )
    }
    try {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        return NextResponse.json(
          { error: 'Webhook 시그니처가 유효하지 않습니다.' },
          { status: 401 },
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Webhook 시그니처 검증 실패' },
        { status: 401 },
      )
    }
  }

  // 2. body 파싱 및 필수 필드 검증
  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: '유효하지 않은 JSON 형식입니다.' },
      { status: 400 },
    )
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: '요청 본문이 올바르지 않습니다.' },
      { status: 400 },
    )
  }

  const subMid = getString(body.subMid || body.mbrNo)
  const amount = getString(body.amount || body.amt)
  const status = getString(body.status || body.resultCode)
  const approveNo = getString(body.approveNo || body.authNo)
  const pgTransactionId = getString(body.pgTransactionId || body.tid)
  const hospitalId = getString(body.hospitalId)

  if (!subMid || !amount) {
    return NextResponse.json(
      { error: 'subMid, amount 필드는 필수입니다.' },
      { status: 400 },
    )
  }

  const parsedAmount = parseFloat(amount)
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json(
      { error: '유효하지 않은 결제 금액입니다.' },
      { status: 400 },
    )
  }

  // 3. paidAt / cancelledAt 결정
  const mappedStatus = mapStatus(status)
  const now = new Date()
  const paidAt = mappedStatus === 'PAID' ? now : null
  const cancelledAt = mappedStatus === 'CANCELLED' ? now : null

  // 4. PaymentLog INSERT
  try {
    await prisma.paymentLog.create({
      data: {
        hospitalId: hospitalId || null,
        subMid,
        approveNo: approveNo || null,
        amount: parsedAmount,
        status: mappedStatus,
        pgTransactionId: pgTransactionId || null,
        paidAt,
        cancelledAt,
        rawPayload: rawBody,
      },
    })
  } catch (e) {
    console.error('PaymentLog INSERT 실패:', e)
    return NextResponse.json(
      { error: '결제 로그 저장에 실패했습니다.' },
      { status: 500 },
    )
  }

  // 5. PG사에 200 OK 응답
  return NextResponse.json({ success: true })
}

/** PG사 상태 코드를 내부 상태로 매핑 */
function mapStatus(raw: string): string {
  const upper = raw.toUpperCase()
  if (upper === 'PAID' || upper === '0000' || upper === 'SUCCESS') return 'PAID'
  if (upper === 'CANCELLED' || upper === 'CANCEL') return 'CANCELLED'
  return 'READY'
}
