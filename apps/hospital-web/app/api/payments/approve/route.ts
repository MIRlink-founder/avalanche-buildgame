import { NextResponse } from "next/server"
import { approvePaymentAndBuildPayload } from "@/lib/payments/payment-service"
import type { PaymentMethod } from "@/lib/payments/payment-types"
import { AuthError, assertHospitalAccess, requireAuth } from "@/lib/auth-guard"
import {
  createIdempotencyHash,
  getIdempotencyKey,
  MAX_IDEMPOTENCY_KEY_LENGTH,
  parseIdempotencyResponse,
  serializeIdempotencyResponse,
} from "@/lib/payments/idempotency"

export const runtime = "nodejs"

const PAYMENT_METHODS = new Set<PaymentMethod>(["CARD", "CASH", "MIXED"])

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
    const hospitalId = getString(body.hospitalId)
    const medicalRecordId = getPositiveInt(body.medicalRecordId)
    const amount = getAmount(body.amount)
    const paymentMethodValue = getString(body.paymentMethod).toUpperCase()
    const subMerchantId = getString(body.subMerchantId)
    const description = getString(body.description)
    const metadata = getMetadata(body.metadata)
    const persist = body.persist === true
    const idempotencyKey = getIdempotencyKey(request)

    if (idempotencyKey && idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      return NextResponse.json(
        { error: "멱등성 키 길이가 올바르지 않습니다" },
        { status: 400 }
      )
    }

    if (!orderId || !hospitalId || !medicalRecordId || !amount) {
      return NextResponse.json(
        { error: "필수 결제 값이 누락되었습니다" },
        { status: 400 }
      )
    }

    assertHospitalAccess(user, hospitalId)

    if (
      paymentMethodValue &&
      !PAYMENT_METHODS.has(paymentMethodValue as PaymentMethod)
    ) {
      return NextResponse.json(
        { error: "결제 수단 값이 올바르지 않습니다" },
        { status: 400 }
      )
    }

    const idempotencyHash = idempotencyKey
      ? createIdempotencyHash({
          orderId,
          hospitalId,
          medicalRecordId,
          amount,
          paymentMethod: paymentMethodValue,
          subMerchantId,
          description,
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
            operation: "APPROVE",
            requestHash: idempotencyHash,
            status: "PENDING",
          },
        })
      }
    }

    const { result, payload } = await approvePaymentAndBuildPayload({
      orderId,
      medicalRecordId,
      hospitalId,
      amount,
      paymentMethod: paymentMethodValue
        ? (paymentMethodValue as PaymentMethod)
        : undefined,
      description: description || undefined,
      subMerchantId: subMerchantId || undefined,
      metadata,
    })

    if (persist) {
      const { prisma } = await import("@mire/database")

      const medicalRecord = await prisma.medicalRecord.findUnique({
        where: { id: medicalRecordId },
        select: { hospitalId: true },
      })

      if (!medicalRecord) {
        return NextResponse.json(
          { error: "진료 기록을 찾을 수 없습니다" },
          { status: 404 }
        )
      }

      if (medicalRecord.hospitalId !== hospitalId) {
        return NextResponse.json(
          { error: "병원 정보가 일치하지 않습니다" },
          { status: 400 }
        )
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { medicalRecordId },
        select: { id: true },
      })

      if (existingPayment) {
        return NextResponse.json(
          { error: "이미 결제 정보가 존재합니다" },
          { status: 409 }
        )
      }

      const savedPayment = await prisma.payment.create({
        data: {
          medicalRecordId: payload.medicalRecordId,
          hospitalId: payload.hospitalId,
          subMid: payload.subMid,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          status: payload.status,
          approveNo: payload.approveNo,
          pgTransactionId: payload.pgTransactionId,
          paidAt: payload.paidAt,
        },
        select: { id: true },
      })

      await prisma.medicalRecord.updateMany({
        where: {
          id: medicalRecordId,
          status: "DRAFT",
        },
        data: { status: "PAID" },
      })

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
                  : "결제 승인 처리 중 오류가 발생했습니다",
            }),
          },
        })
      } catch {
        // ignore idempotency update failure
      }
    }

    console.error("결제 승인 처리 오류:", error)
    return NextResponse.json(
      { error: "결제 승인 처리 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
