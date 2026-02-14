import crypto from "crypto"

export function formatNicepayDate(date: Date) {
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const hour = date.getHours().toString().padStart(2, "0")
  const minute = date.getMinutes().toString().padStart(2, "0")
  const second = date.getSeconds().toString().padStart(2, "0")

  return `${year}${month}${day}${hour}${minute}${second}`
}

export function createSignData(payload: string) {
  return crypto.createHash("sha256").update(payload).digest("hex")
}

export function createNicepayTid(mid: string, date: Date) {
  const yy = date.getFullYear().toString().slice(2)
  const mm = (date.getMonth() + 1).toString().padStart(2, "0")
  const dd = date.getDate().toString().padStart(2, "0")
  const hh = date.getHours().toString().padStart(2, "0")
  const mi = date.getMinutes().toString().padStart(2, "0")
  const ss = date.getSeconds().toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 9000 + 1000).toString()

  return `${mid}0101${yy}${mm}${dd}${hh}${mi}${ss}${random}`
}

export function createEncData(plainText: string, merchantKey: string) {
  const key = Buffer.from(merchantKey.substring(0, 16), "utf8")
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null)
  cipher.setAutoPadding(true)
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ])
  return encrypted.toString("hex").toUpperCase()
}
