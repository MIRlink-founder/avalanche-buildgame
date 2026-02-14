import iconv from "iconv-lite"
import {
  createEncData,
  createNicepayTid,
  createSignData,
  formatNicepayDate,
} from "@/lib/nicepay/nicepay-crypto"
import type {
  NicepayApiResponse,
  NicepayCancelInput,
  NicepayCardKeyinInput,
  NicepayStatusInput,
} from "@/lib/nicepay/nicepay-types"

interface NicepayConfig {
  mid: string
  merchantKey: string
  apiBase: string
}

const DEFAULT_API_BASE = "https://webapi.nicepay.co.kr"

function getNicepayConfig(): NicepayConfig {
  const mid = process.env.NICEPAY_MID
  const merchantKey = process.env.NICEPAY_MERCHANT_KEY
  const apiBase = process.env.NICEPAY_API_BASE || DEFAULT_API_BASE

  if (!mid || !merchantKey) {
    throw new Error("NICEPAY 환경변수가 설정되지 않았습니다")
  }

  return { mid, merchantKey, apiBase }
}

function normalizeAmount(value: number | string) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("금액 값이 올바르지 않습니다")
    }
    return Math.trunc(value).toString()
  }

  const trimmed = value.trim()
  if (!/^[0-9]+$/.test(trimmed)) {
    throw new Error("금액 값이 올바르지 않습니다")
  }
  return trimmed
}

function buildPlainCardText(input: NicepayCardKeyinInput) {
  const buyerAuthNum = input.buyerAuthNum ?? ""
  const cardPwd = input.cardPwd ?? ""
  return `CardNo=${input.cardNo}&CardExpire=${input.cardExpire}&BuyerAuthNum=${buyerAuthNum}&CardPwd=${cardPwd}`
}

function buildFormBody(params: Record<string, string | undefined>) {
  const filteredEntries = Object.entries(params).filter(
    ([, value]) => typeof value === "string" && value.length > 0
  )
  const query = new URLSearchParams(filteredEntries as Array<[string, string]>)
  const encoded = iconv.encode(query.toString(), "euc-kr")
  return new Uint8Array(encoded)
}

async function postNicepay(url: string, params: Record<string, string | undefined>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=euc-kr",
    },
    body: buildFormBody(params),
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  const decoded = iconv.decode(buffer, "euc-kr")

  if (!response.ok) {
    throw new Error(`NICEPAY 요청 실패: ${response.status}`)
  }

  try {
    return JSON.parse(decoded) as NicepayApiResponse
  } catch (error) {
    throw new Error("NICEPAY 응답 파싱에 실패했습니다")
  }
}

export async function requestNicepayCardKeyin(input: NicepayCardKeyinInput) {
  const { mid, merchantKey, apiBase } = getNicepayConfig()
  const now = new Date()
  const ediDate = formatNicepayDate(now)
  const tid = createNicepayTid(mid, now)
  const amt = normalizeAmount(input.amount)
  const signData = createSignData(mid + amt + ediDate + input.moid + merchantKey)
  const encData = createEncData(buildPlainCardText(input), merchantKey)

  return postNicepay(`${apiBase}/webapi/card_keyin.jsp`, {
    TID: tid,
    MID: mid,
    EdiDate: ediDate,
    Moid: input.moid,
    Amt: amt,
    GoodsName: input.goodsName,
    EncData: encData,
    SignData: signData,
    CardInterest: input.cardInterest,
    CardQuota: input.cardQuota,
    BuyerEmail: input.buyerEmail,
    BuyerTel: input.buyerTel,
    BuyerName: input.buyerName,
    CharSet: "utf-8",
    EdiType: "JSON",
  })
}

export async function requestNicepayCancel(input: NicepayCancelInput) {
  const { mid, merchantKey, apiBase } = getNicepayConfig()
  const ediDate = formatNicepayDate(new Date())
  const cancelAmount = normalizeAmount(input.cancelAmount)
  const signData = createSignData(mid + cancelAmount + ediDate + merchantKey)

  return postNicepay(`${apiBase}/webapi/cancel_process.jsp`, {
    TID: input.tid,
    MID: mid,
    Moid: input.moid,
    CancelAmt: cancelAmount,
    CancelMsg: input.cancelMessage,
    PartialCancelCode: input.partialCancelCode,
    EdiDate: ediDate,
    SignData: signData,
    CharSet: "utf-8",
    EdiType: "JSON",
  })
}

export async function requestNicepayStatus(input: NicepayStatusInput) {
  const { mid, merchantKey, apiBase } = getNicepayConfig()
  const ediDate = formatNicepayDate(new Date())
  const signData = createSignData(input.tid + mid + ediDate + merchantKey)

  return postNicepay(`${apiBase}/webapi/inquery/trans_status.jsp`, {
    TID: input.tid,
    MID: mid,
    EdiDate: ediDate,
    SignData: signData,
    CharSet: "utf-8",
    EdiType: "JSON",
  })
}
