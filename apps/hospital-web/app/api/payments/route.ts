import { NextResponse } from "next/server"
import { prisma } from "@mire/database"
import { AuthError, requireAuth, resolveHospitalId } from "@/lib/auth-guard"

export const runtime = "nodejs"

const PAYMENT_STATUSES = new Set(["READY", "PAID", "SETTLED", "CANCELLED"])

function getPositiveInt(value: string | null) {
  if (!value) {
    return null
  }
  if (!/^[0-9]+$/.test(value.trim())) {
    return null
  }
  const parsed = Number.parseInt(value.trim(), 10)
  return parsed > 0 ? parsed : null
}

function getLimit(value: string | null) {
  if (!value) {
    return 20
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20
  }
  return Math.min(parsed, 100)
}

function getDate(value: string | null) {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const requestedHospitalId = searchParams.get("hospitalId")?.trim() || ""
    const status = searchParams.get("status")?.trim() || ""
    const medicalRecordId = getPositiveInt(searchParams.get("medicalRecordId"))
    const settlementId = getPositiveInt(searchParams.get("settlementId"))
    const cursor = getPositiveInt(searchParams.get("cursor"))
    const limit = getLimit(searchParams.get("limit"))
    const createdFrom = getDate(searchParams.get("createdFrom"))
    const createdTo = getDate(searchParams.get("createdTo"))
    const paidFrom = getDate(searchParams.get("paidFrom"))
    const paidTo = getDate(searchParams.get("paidTo"))

    const hospitalId = resolveHospitalId(user, requestedHospitalId || null)

    if (status && !PAYMENT_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "결제 상태 값이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    if (
      (searchParams.has("createdFrom") && !createdFrom) ||
      (searchParams.has("createdTo") && !createdTo) ||
      (searchParams.has("paidFrom") && !paidFrom) ||
      (searchParams.has("paidTo") && !paidTo)
    ) {
      return NextResponse.json(
        { error: "날짜 형식이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      hospitalId,
    }

    if (status) {
      where.status = status
    }

    if (medicalRecordId) {
      where.medicalRecordId = medicalRecordId
    }

    if (settlementId) {
      where.settlementId = settlementId
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      }
    }

    if (paidFrom || paidTo) {
      where.paidAt = {
        ...(paidFrom ? { gte: paidFrom } : {}),
        ...(paidTo ? { lte: paidTo } : {}),
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

    const hasMore = payments.length > limit
    const data = hasMore ? payments.slice(0, limit) : payments
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null

    return NextResponse.json({ data, nextCursor })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("결제 내역 조회 오류:", error)
    return NextResponse.json(
      { error: "결제 내역 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
