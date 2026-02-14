export interface NicepayCardKeyinInput {
  moid: string
  amount: number | string
  goodsName: string
  cardNo: string
  cardExpire: string
  buyerAuthNum?: string
  cardPwd?: string
  cardInterest: "0" | "1"
  cardQuota: string
  buyerEmail?: string
  buyerTel?: string
  buyerName?: string
}

export interface NicepayCancelInput {
  tid: string
  moid: string
  cancelAmount: number | string
  cancelMessage: string
  partialCancelCode: "0" | "1"
}

export interface NicepayStatusInput {
  tid: string
}

export type NicepayApiResponse = Record<string, string>
