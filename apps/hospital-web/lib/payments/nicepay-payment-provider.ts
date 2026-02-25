import type { PaymentProvider } from "@/lib/payments/payment-provider"
import type {
  PaymentApproveRequest,
  PaymentApproveResult,
  PaymentCancelRequest,
  PaymentCancelResult,
  PaymentStatusRequest,
  PaymentStatusResult,
} from "@/lib/payments/payment-types"
import {
  requestNicepayCardKeyin,
  requestNicepayCancel,
  requestNicepayStatus,
} from "@/lib/nicepay/nicepay-client"

const NICEPAY_SUCCESS_CODE = "3001"

function isApproved(resultCode: string): boolean {
  return resultCode === NICEPAY_SUCCESS_CODE
}

export class NicePosPaymentProvider implements PaymentProvider {
  type = "NICE_POS" as const

  async approve(request: PaymentApproveRequest): Promise<PaymentApproveResult> {
    const metadata = request.metadata ?? {}
    const cardNo = metadata.cardNo
    const cardExpire = metadata.cardExpire

    if (!cardNo || !cardExpire) {
      throw new Error("카드 번호와 유효기간은 필수입니다")
    }

    const response = await requestNicepayCardKeyin({
      moid: request.orderId,
      amount: request.amount,
      goodsName: request.description ?? "진료비",
      cardNo,
      cardExpire,
      buyerAuthNum: metadata.buyerAuthNum,
      cardPwd: metadata.cardPwd,
      cardInterest: (metadata.cardInterest as "0" | "1") ?? "0",
      cardQuota: metadata.cardQuota ?? "00",
      buyerEmail: metadata.buyerEmail,
      buyerTel: metadata.buyerTel,
      buyerName: metadata.buyerName,
    })

    const approved = isApproved(response.ResultCode ?? "")

    return {
      provider: this.type,
      status: approved ? "APPROVED" : "FAILED",
      approvedAmount: approved ? request.amount : "0",
      approvedAt: approved ? new Date() : undefined,
      providerTransactionId: response.TID,
      approvalCode: response.AuthCode,
      subMerchantId: request.subMerchantId ?? response.MID,
      raw: response,
    }
  }

  async cancel(request: PaymentCancelRequest): Promise<PaymentCancelResult> {
    if (!request.providerTransactionId) {
      throw new Error("취소에 필요한 거래 ID(TID)가 없습니다")
    }

    const response = await requestNicepayCancel({
      tid: request.providerTransactionId,
      moid: request.orderId,
      cancelAmount: request.amount,
      cancelMessage: request.reason,
      partialCancelCode: "0",
    })

    const cancelled = isApproved(response.ResultCode ?? "")

    return {
      provider: this.type,
      status: cancelled ? "CANCELLED" : "FAILED",
      cancelledAmount: cancelled ? request.amount : "0",
      cancelledAt: cancelled ? new Date() : undefined,
      providerTransactionId: response.TID,
      approvalCode: response.AuthCode,
      subMerchantId: request.subMerchantId ?? response.MID,
      raw: response,
    }
  }

  async status(request: PaymentStatusRequest): Promise<PaymentStatusResult> {
    if (!request.providerTransactionId) {
      throw new Error("조회에 필요한 거래 ID(TID)가 없습니다")
    }

    const response = await requestNicepayStatus({
      tid: request.providerTransactionId,
    })

    const approved = isApproved(response.ResultCode ?? "")

    return {
      provider: this.type,
      status: approved ? "APPROVED" : "FAILED",
      approvedAmount: response.Amt,
      approvedAt: approved ? new Date() : undefined,
      providerTransactionId: response.TID,
      approvalCode: response.AuthCode,
      subMerchantId: request.subMerchantId ?? response.MID,
      raw: response,
    }
  }
}
