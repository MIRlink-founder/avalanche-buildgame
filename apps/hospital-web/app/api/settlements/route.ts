import { NextResponse } from "next/server"
import { prisma } from "@mire/database"
import { AuthError, requireAuth, resolveHospitalId } from "@/lib/auth-guard"

export const runtime = "nodejs"

const SETTLEMENT_STATUSES = new Set(["PENDING_PAYMENT", "SETTLED"])

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
    const cursor = getPositiveInt(searchParams.get("cursor"))
    const limit = getLimit(searchParams.get("limit"))
    const periodFrom = getDate(searchParams.get("periodFrom"))
    const periodTo = getDate(searchParams.get("periodTo"))
    const createdFrom = getDate(searchParams.get("createdFrom"))
    const createdTo = getDate(searchParams.get("createdTo"))

    const hospitalId = resolveHospitalId(user, requestedHospitalId || null)

    if (status && !SETTLEMENT_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "정산 상태 값이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    if (
      (searchParams.has("periodFrom") && !periodFrom) ||
      (searchParams.has("periodTo") && !periodTo) ||
      (searchParams.has("createdFrom") && !createdFrom) ||
      (searchParams.has("createdTo") && !createdTo)
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

    if (periodFrom || periodTo) {
      where.settlementPeriodStart = {
        ...(periodFrom ? { gte: periodFrom } : {}),
      }
      where.settlementPeriodEnd = {
        ...(periodTo ? { lte: periodTo } : {}),
      }
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      }
    }

    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        hospitalId: true,
        settlementPeriodStart: true,
        settlementPeriodEnd: true,
        totalVolume: true,
        appliedRate: true,
        paybackAmount: true,
        isNftBoosted: true,
        status: true,
        settledAt: true,
        createdAt: true,
      },
    })

    const hasMore = settlements.length > limit
    const data = hasMore ? settlements.slice(0, limit) : settlements
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null

    return NextResponse.json({ data, nextCursor })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    console.error("정산 내역 조회 오류:", error)
    return NextResponse.json(
      { error: "정산 내역 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
