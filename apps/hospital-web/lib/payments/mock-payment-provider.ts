import crypto from "crypto"
import type { PaymentProvider } from "@/lib/payments/payment-provider"
import type {
  PaymentApproveRequest,
  PaymentApproveResult,
  PaymentCancelRequest,
  PaymentCancelResult,
  PaymentStatusRequest,
  PaymentStatusResult,
} from "@/lib/payments/payment-types"

const DEFAULT_SUB_MID = "MOCK-SUB-MID"

function createMockId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function normalizeAmount(amount: string) {
  const trimmed = amount.trim()
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(trimmed)) {
    throw new Error("결제 금액 형식이 올바르지 않습니다")
  }
  return trimmed
}

export class MockPaymentProvider implements PaymentProvider {
  type = "MOCK" as const

  async approve(request: PaymentApproveRequest): Promise<PaymentApproveResult> {
    const approvedAmount = normalizeAmount(request.amount)
    const approvedAt = new Date()
    const providerTransactionId = createMockId("MOCK-TX")
    const approvalCode = createMockId("MOCK-APPROVE")

    return {
      provider: this.type,
      status: "APPROVED",
      approvedAmount,
      approvedAt,
      providerTransactionId,
      approvalCode,
      subMerchantId: request.subMerchantId ?? DEFAULT_SUB_MID,
      raw: {
        orderId: request.orderId,
        amount: approvedAmount,
        medicalRecordId: request.medicalRecordId.toString(),
        hospitalId: request.hospitalId,
      },
    }
  }

  async cancel(request: PaymentCancelRequest): Promise<PaymentCancelResult> {
    const cancelledAmount = normalizeAmount(request.amount)
    const cancelledAt = new Date()

    return {
      provider: this.type,
      status: "CANCELLED",
      cancelledAmount,
      cancelledAt,
      providerTransactionId:
        request.providerTransactionId ?? createMockId("MOCK-TX"),
      approvalCode: request.approvalCode ?? createMockId("MOCK-CANCEL"),
      subMerchantId: request.subMerchantId ?? DEFAULT_SUB_MID,
      raw: {
        orderId: request.orderId,
        amount: cancelledAmount,
        reason: request.reason,
      },
    }
  }

  async status(request: PaymentStatusRequest): Promise<PaymentStatusResult> {
    const approvedAt = new Date()

    return {
      provider: this.type,
      status: "APPROVED",
      approvedAmount: "0",
      approvedAt,
      providerTransactionId:
        request.providerTransactionId ?? createMockId("MOCK-TX"),
      approvalCode: request.approvalCode ?? createMockId("MOCK-STATUS"),
      subMerchantId: request.subMerchantId ?? DEFAULT_SUB_MID,
      raw: {
        orderId: request.orderId ?? "",
      },
    }
  }
}
