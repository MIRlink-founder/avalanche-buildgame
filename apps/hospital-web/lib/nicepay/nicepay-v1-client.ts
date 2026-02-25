/**
 * NicePay Start API (v1) REST 클라이언트
 *
 * JS SDK 결제창에서 인증 완료 후 서버 사이드에서 결제 승인/취소를 처리한다.
 * 인증: Basic base64(clientId:secretKey)
 * 문서: https://developers.nicepay.co.kr
 */

interface NicepayV1Config {
  clientId: string
  secretKey: string
  apiBase: string
}

const DEFAULT_API_BASE = "https://sandbox-api.nicepay.co.kr"

function getNicepayV1Config(): NicepayV1Config {
  const clientId = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID
  const secretKey = process.env.NICEPAY_SECRET_KEY
  const apiBase = process.env.NICEPAY_V1_API_BASE || DEFAULT_API_BASE

  if (!clientId || !secretKey) {
    throw new Error(
      "NEXT_PUBLIC_NICEPAY_CLIENT_ID 또는 NICEPAY_SECRET_KEY 환경변수가 설정되지 않았습니다"
    )
  }

  return { clientId, secretKey, apiBase }
}

function createBasicAuth(clientId: string, secretKey: string): string {
  const credentials = Buffer.from(`${clientId}:${secretKey}`).toString(
    "base64"
  )
  return `Basic ${credentials}`
}

export interface NicepayV1ApproveRequest {
  tid: string
  amount: number
  orderId: string
}

export interface NicepayV1CancelRequest {
  tid: string
  reason: string
  cancelAmt?: number
  orderId?: string
}

export interface NicepayV1Response {
  resultCode: string
  resultMsg: string
  tid: string
  orderId: string
  amount: number
  cancelledTotalAmount?: number
  paidAt?: string
  cancelledAt?: string
  approveNo?: string
  [key: string]: unknown
}

async function requestV1Api(
  path: string,
  body: Record<string, unknown>
): Promise<NicepayV1Response> {
  const { clientId, secretKey, apiBase } = getNicepayV1Config()

  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: createBasicAuth(clientId, secretKey),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`NicePay v1 API 요청 실패: ${response.status}`)
  }

  const data = (await response.json()) as NicepayV1Response
  return data
}

/**
 * 결제 승인
 * POST /v1/payments/{tid}
 */
export async function approveV1Payment(
  request: NicepayV1ApproveRequest
): Promise<NicepayV1Response> {
  const result = await requestV1Api(`/v1/payments/${request.tid}`, {
    amount: request.amount,
    orderId: request.orderId,
  })

  if (result.resultCode !== "0000") {
    throw new Error(
      `결제 승인 실패: [${result.resultCode}] ${result.resultMsg}`
    )
  }

  return result
}

/**
 * 결제 취소
 * POST /v1/payments/{tid}/cancel
 */
export async function cancelV1Payment(
  request: NicepayV1CancelRequest
): Promise<NicepayV1Response> {
  const body: Record<string, unknown> = {
    reason: request.reason,
  }

  if (request.cancelAmt !== undefined) {
    body.cancelAmt = request.cancelAmt
  }

  if (request.orderId) {
    body.orderId = request.orderId
  }

  const result = await requestV1Api(
    `/v1/payments/${request.tid}/cancel`,
    body
  )

  if (result.resultCode !== "0000") {
    throw new Error(
      `결제 취소 실패: [${result.resultCode}] ${result.resultMsg}`
    )
  }

  return result
}

/**
 * 결제 상태 조회
 * GET /v1/payments/{tid}
 */
export async function getV1PaymentStatus(
  tid: string
): Promise<NicepayV1Response> {
  const { clientId, secretKey, apiBase } = getNicepayV1Config()

  const response = await fetch(`${apiBase}/v1/payments/${tid}`, {
    method: "GET",
    headers: {
      Authorization: createBasicAuth(clientId, secretKey),
    },
  })

  if (!response.ok) {
    throw new Error(`NicePay v1 상태 조회 실패: ${response.status}`)
  }

  return (await response.json()) as NicepayV1Response
}
