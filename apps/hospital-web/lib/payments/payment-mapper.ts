import type {
  PaymentApproveRequest,
  PaymentApproveResult,
  PaymentCancelResult,
  PaymentCreatePayload,
  PaymentProviderStatus,
  PaymentStatus,
  PaymentUpdatePayload,
} from "@/lib/payments/payment-types"

export function mapProviderStatusToPaymentStatus(
  status: PaymentProviderStatus
): PaymentStatus {
  switch (status) {
    case "APPROVED":
      return "PAID"
    case "CANCELLED":
      return "CANCELLED"
    case "PENDING":
      return "READY"
    case "FAILED":
      return "READY"
  }
}

export function mapApproveResultToPaymentCreatePayload(
  request: PaymentApproveRequest,
  result: PaymentApproveResult
): PaymentCreatePayload {
  if (result.status !== "APPROVED") {
    throw new Error("결제 승인 결과가 완료 상태가 아닙니다")
  }

  const subMid = result.subMerchantId ?? request.subMerchantId
  if (!subMid) {
    throw new Error("가맹점 식별자가 필요합니다")
  }

  return {
    medicalRecordId: request.medicalRecordId,
    hospitalId: request.hospitalId,
    subMid,
    amount: result.approvedAmount,
    paymentMethod: request.paymentMethod,
    status: "PAID",
    approveNo: result.approvalCode,
    pgTransactionId: result.providerTransactionId,
    paidAt: result.approvedAt ?? new Date(),
  }
}

export function mapCancelResultToPaymentUpdatePayload(
  result: PaymentCancelResult
): PaymentUpdatePayload {
  if (result.status !== "CANCELLED") {
    throw new Error("결제 취소 결과가 완료 상태가 아닙니다")
  }

  return {
    status: "CANCELLED",
    approveNo: result.approvalCode,
    pgTransactionId: result.providerTransactionId,
    cancelledAt: result.cancelledAt ?? new Date(),
  }
}
