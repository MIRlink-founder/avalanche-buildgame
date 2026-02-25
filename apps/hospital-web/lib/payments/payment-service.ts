import type {
  PaymentApproveRequest,
  PaymentCancelRequest,
  PaymentProviderType,
  PaymentStatusRequest,
} from "@/lib/payments/payment-types"
import type { PaymentProvider } from "@/lib/payments/payment-provider"
import { MockPaymentProvider } from "@/lib/payments/mock-payment-provider"
import { NicePosPaymentProvider } from "@/lib/payments/nicepay-payment-provider"
import {
  mapApproveResultToPaymentCreatePayload,
  mapCancelResultToPaymentUpdatePayload,
} from "@/lib/payments/payment-mapper"

const SUPPORTED_PROVIDERS: PaymentProviderType[] = ["MOCK", "NICE_POS"]

export function getPaymentProviderType(): PaymentProviderType {
  const value = process.env.PAYMENT_PROVIDER
  if (value === "NICE_POS") {
    return "NICE_POS"
  }
  return "MOCK"
}

export function createPaymentProvider(
  type: PaymentProviderType = getPaymentProviderType()
): PaymentProvider {
  if (!SUPPORTED_PROVIDERS.includes(type)) {
    throw new Error("지원하지 않는 결제 프로바이더입니다")
  }

  if (type === "MOCK") {
    return new MockPaymentProvider()
  }

  if (type === "NICE_POS") {
    return new NicePosPaymentProvider()
  }

  throw new Error("지원하지 않는 결제 프로바이더입니다")
}

export async function requestPaymentApproval(
  request: PaymentApproveRequest,
  provider: PaymentProvider = createPaymentProvider()
) {
  return provider.approve(request)
}

export async function requestPaymentCancel(
  request: PaymentCancelRequest,
  provider: PaymentProvider = createPaymentProvider()
) {
  return provider.cancel(request)
}

export async function requestPaymentStatus(
  request: PaymentStatusRequest,
  provider: PaymentProvider = createPaymentProvider()
) {
  return provider.status(request)
}

export async function approvePaymentAndBuildPayload(
  request: PaymentApproveRequest,
  provider: PaymentProvider = createPaymentProvider()
) {
  const result = await provider.approve(request)
  const payload = mapApproveResultToPaymentCreatePayload(request, result)

  return { result, payload }
}

export async function cancelPaymentAndBuildPayload(
  request: PaymentCancelRequest,
  provider: PaymentProvider = createPaymentProvider()
) {
  const result = await provider.cancel(request)
  const payload = mapCancelResultToPaymentUpdatePayload(result)

  return { result, payload }
}
