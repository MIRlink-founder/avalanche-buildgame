import { verifyToken } from "@/lib/auth-middleware"

export class AuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "SUB_ADMIN"])

export async function requireAuth(request: Request) {
  try {
    return await verifyToken(request)
  } catch (error) {
    if (error instanceof Error) {
      throw new AuthError(error.message || "인증이 필요합니다", 401)
    }
    throw new AuthError("인증이 필요합니다", 401)
  }
}

export function isAdminRole(role: string) {
  return ADMIN_ROLES.has(role)
}

export function resolveHospitalId(
  user: { role: string; hospitalId: string | null },
  requestedHospitalId: string | null
) {
  if (isAdminRole(user.role)) {
    if (!requestedHospitalId) {
      throw new AuthError("병원 ID가 필요합니다", 400)
    }
    return requestedHospitalId
  }

  if (!user.hospitalId) {
    throw new AuthError("병원 정보가 없습니다", 403)
  }

  if (requestedHospitalId && requestedHospitalId !== user.hospitalId) {
    throw new AuthError("병원 접근 권한이 없습니다", 403)
  }

  return user.hospitalId
}

export function assertHospitalAccess(
  user: { role: string; hospitalId: string | null },
  targetHospitalId: string
) {
  if (isAdminRole(user.role)) {
    return
  }

  if (!user.hospitalId || user.hospitalId !== targetHospitalId) {
    throw new AuthError("병원 접근 권한이 없습니다", 403)
  }
}
