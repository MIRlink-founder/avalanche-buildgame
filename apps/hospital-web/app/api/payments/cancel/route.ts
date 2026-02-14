import { NextResponse } from "next/server"
import { cancelPaymentAndBuildPayload } from "@/lib/payments/payment-service"
import { AuthError, assertHospitalAccess, requireAuth } from "@/lib/auth-guard"
import {
  createIdempotencyHash,
  getIdempotencyKey,
  MAX_IDEMPOTENCY_KEY_LENGTH,
  parseIdempotencyResponse,
  serializeIdempotencyResponse,
} from "@/lib/payments/idempotency"

export const runtime = "nodejs"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function getAmount(value: unknown) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return ""
    }
    const text = value.toString()
    return /^[0-9]+(\.[0-9]{1,2})?$/.test(text) ? text : ""
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    return /^[0-9]+(\.[0-9]{1,2})?$/.test(trimmed) ? trimmed : ""
  }

  return ""
}

function getPositiveInt(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === "string" && /^[0-9]+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10)
    return parsed > 0 ? parsed : null
  }
  return null
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
    const amount = getAmount(body.amount)
    const reason = getString(body.reason)
    const providerTransactionId = getString(body.providerTransactionId)
    const approvalCode = getString(body.approvalCode)
    const subMerchantId = getString(body.subMerchantId)
    const metadata = getMetadata(body.metadata)
    const medicalRecordId = getPositiveInt(body.medicalRecordId)
    const persist = body.persist === true
    const hospitalId = getString(body.hospitalId)
    const idempotencyKey = getIdempotencyKey(request)

    if (idempotencyKey && idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      return NextResponse.json(
        { error: "멱등성 키 길이가 올바르지 않습니다" },
        { status: 400 }
      )
    }

    if (!orderId || !amount || !reason) {
      return NextResponse.json(
        { error: "필수 취소 값이 누락되었습니다" },
        { status: 400 }
      )
    }

    if (hospitalId) {
      assertHospitalAccess(user, hospitalId)
    } else if (user.hospitalId && !persist) {
      return NextResponse.json(
        { error: "병원 ID가 필요합니다" },
        { status: 400 }
      )
    }

    const idempotencyHash = idempotencyKey
      ? createIdempotencyHash({
          orderId,
          amount,
          reason,
          providerTransactionId,
          approvalCode,
          subMerchantId,
          medicalRecordId,
        })
      : ""

    if (idempotencyKey) {
      const { prisma } = await import("@mire/database")
      const existing = await prisma.paymentIdempotency.findUnique({
        where: { idempotencyKey },
      })

      if (existing) {
        if (existing.requestHash !== idempotencyHash) {
          return NextResponse.json(
            { error: "멱등성 키가 다른 요청에 사용되었습니다" },
            { status: 409 }
          )
        }

        if (existing.status === "SUCCEEDED" && existing.response) {
          return NextResponse.json(parseIdempotencyResponse(existing.response))
        }

        if (existing.status === "PENDING") {
          return NextResponse.json(
            { error: "동일한 요청이 처리 중입니다" },
            { status: 409 }
          )
        }

        await prisma.paymentIdempotency.update({
          where: { idempotencyKey },
          data: { status: "PENDING" },
        })
      } else {
        await prisma.paymentIdempotency.create({
          data: {
            idempotencyKey,
            operation: "CANCEL",
            requestHash: idempotencyHash,
            status: "PENDING",
          },
        })
      }
    }

    const { result, payload } = await cancelPaymentAndBuildPayload({
      orderId,
      amount,
      reason,
      providerTransactionId: providerTransactionId || undefined,
      approvalCode: approvalCode || undefined,
      subMerchantId: subMerchantId || undefined,
      metadata,
    })

    if (persist) {
      if (!medicalRecordId && !providerTransactionId && !approvalCode) {
        return NextResponse.json(
          { error: "DB 업데이트용 식별자가 필요합니다" },
          { status: 400 }
        )
      }

      const { prisma } = await import("@mire/database")

      let payment = null

      if (medicalRecordId) {
        payment = await prisma.payment.findUnique({
          where: { medicalRecordId },
          select: { id: true, medicalRecordId: true },
        })
      } else if (providerTransactionId || approvalCode) {
        const orFilters: Array<{
          pgTransactionId?: string
          approveNo?: string
        }> = []

        if (providerTransactionId) {
          orFilters.push({ pgTransactionId: providerTransactionId })
        }

        if (approvalCode) {
          orFilters.push({ approveNo: approvalCode })
        }

        payment = await prisma.payment.findFirst({
          where: { OR: orFilters },
          select: { id: true, medicalRecordId: true },
        })
      }

      if (!payment) {
        return NextResponse.json(
          { error: "결제 정보를 찾을 수 없습니다" },
          { status: 404 }
        )
      }

      const paymentDetail = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: { hospitalId: true },
      })

      if (!paymentDetail) {
        return NextResponse.json(
          { error: "결제 정보를 찾을 수 없습니다" },
          { status: 404 }
        )
      }

      assertHospitalAccess(user, paymentDetail.hospitalId)

      const savedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: payload.status,
          approveNo: payload.approveNo,
          pgTransactionId: payload.pgTransactionId,
          cancelledAt: payload.cancelledAt,
        },
        select: { id: true },
      })

      const targetMedicalRecordId =
        medicalRecordId ?? payment.medicalRecordId ?? null

      if (targetMedicalRecordId) {
        await prisma.medicalRecord.updateMany({
          where: {
            id: targetMedicalRecordId,
            status: "PAID",
          },
          data: { status: "DRAFT" },
        })
      }

      const responseBody = {
        success: true,
        result,
        payload,
        persisted: true,
        paymentId: savedPayment.id,
      }

      if (idempotencyKey) {
        await prisma.paymentIdempotency.update({
          where: { idempotencyKey },
          data: {
            status: "SUCCEEDED",
            response: serializeIdempotencyResponse(responseBody),
            paymentId: savedPayment.id,
          },
        })
      }

      return NextResponse.json(responseBody)
    }

    const responseBody = { success: true, result, payload }

    if (idempotencyKey) {
      const { prisma } = await import("@mire/database")
      await prisma.paymentIdempotency.update({
        where: { idempotencyKey },
        data: {
          status: "SUCCEEDED",
          response: serializeIdempotencyResponse(responseBody),
        },
      })
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    const idempotencyKey = getIdempotencyKey(request)
    if (idempotencyKey) {
      try {
        const { prisma } = await import("@mire/database")
        await prisma.paymentIdempotency.update({
          where: { idempotencyKey },
          data: {
            status: "FAILED",
            response: serializeIdempotencyResponse({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "결제 취소 처리 중 오류가 발생했습니다",
            }),
          },
        })
      } catch {
        // ignore idempotency update failure
      }
    }

    console.error("결제 취소 처리 오류:", error)
    return NextResponse.json(
      { error: "결제 취소 처리 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
