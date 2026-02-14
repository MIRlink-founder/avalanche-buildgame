import crypto from "crypto"

export const MAX_IDEMPOTENCY_KEY_LENGTH = 100

export function getIdempotencyKey(request: Request) {
  const key = request.headers.get("Idempotency-Key")
  return key ? key.trim() : ""
}

export function createIdempotencyHash(payload: Record<string, unknown>) {
  const normalized = stableStringify(payload)
  return crypto.createHash("sha256").update(normalized).digest("hex")
}

export function serializeIdempotencyResponse(value: unknown): string {
  return JSON.stringify(value)
}

export function parseIdempotencyResponse(value: unknown) {
  if (typeof value !== "string") {
    return value
  }
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([keyA], [keyB]) => keyA.localeCompare(keyB)
    )
    const serialized = entries
      .map(([key, entryValue]) => {
        return `${JSON.stringify(key)}:${stableStringify(entryValue)}`
      })
      .join(",")
    return `{${serialized}}`
  }

  return JSON.stringify(value)
}
