import type {
  PaymentApproveRequest,
  PaymentApproveResult,
  PaymentCancelRequest,
  PaymentCancelResult,
  PaymentProviderType,
  PaymentStatusRequest,
  PaymentStatusResult,
} from "@/lib/payments/payment-types"

export interface PaymentProvider {
  type: PaymentProviderType
  approve(request: PaymentApproveRequest): Promise<PaymentApproveResult>
  cancel(request: PaymentCancelRequest): Promise<PaymentCancelResult>
  status(request: PaymentStatusRequest): Promise<PaymentStatusResult>
}
