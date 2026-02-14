export type PaymentProviderType = "MOCK" | "NICE_POS"

export type PaymentMethod = "CARD" | "CASH" | "MIXED"

export type PaymentStatus = "READY" | "PAID" | "SETTLED" | "CANCELLED"

export type PaymentProviderStatus =
  | "APPROVED"
  | "CANCELLED"
  | "PENDING"
  | "FAILED"

export interface PaymentApproveRequest {
  orderId: string
  medicalRecordId: number
  hospitalId: string
  amount: string
  paymentMethod?: PaymentMethod
  description?: string
  subMerchantId?: string
  metadata?: Record<string, string>
}

export interface PaymentApproveResult {
  provider: PaymentProviderType
  status: PaymentProviderStatus
  approvedAmount: string
  approvedAt?: Date
  providerTransactionId?: string
  approvalCode?: string
  subMerchantId?: string
  raw: Record<string, string>
}

export interface PaymentCancelRequest {
  orderId: string
  amount: string
  reason: string
  providerTransactionId?: string
  approvalCode?: string
  subMerchantId?: string
  metadata?: Record<string, string>
}

export interface PaymentCancelResult {
  provider: PaymentProviderType
  status: PaymentProviderStatus
  cancelledAmount: string
  cancelledAt?: Date
  providerTransactionId?: string
  approvalCode?: string
  subMerchantId?: string
  raw: Record<string, string>
}

export interface PaymentStatusRequest {
  orderId?: string
  providerTransactionId?: string
  approvalCode?: string
  subMerchantId?: string
  metadata?: Record<string, string>
}

export interface PaymentStatusResult {
  provider: PaymentProviderType
  status: PaymentProviderStatus
  approvedAmount?: string
  approvedAt?: Date
  cancelledAt?: Date
  providerTransactionId?: string
  approvalCode?: string
  subMerchantId?: string
  raw: Record<string, string>
}

export interface PaymentCreatePayload {
  medicalRecordId: number
  hospitalId: string
  subMid: string
  amount: string
  paymentMethod?: PaymentMethod
  status: PaymentStatus
  approveNo?: string
  pgTransactionId?: string
  paidAt?: Date
}

export interface PaymentUpdatePayload {
  status?: PaymentStatus
  approveNo?: string
  pgTransactionId?: string
  paidAt?: Date | null
  cancelledAt?: Date | null
}
