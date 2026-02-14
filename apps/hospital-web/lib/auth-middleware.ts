import jwt from "jsonwebtoken"
import { prisma } from "@mire/database"

export async function verifyToken(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")

  if (!token) {
    throw new Error("인증 토큰이 없습니다")
  }

  // 1. JWT 검증
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string
    email: string
    role: string
  }

  // 2. AuthSession 확인 (토큰 유효성 + 활성화 상태)
  const session = await prisma.authSession.findUnique({
    where: { accessToken: token },
    include: { user: true },
  })

  if (!session || !session.isActive) {
    throw new Error("유효하지 않은 세션입니다")
  }

  // 3. User 상태 실시간 체크
  const statusMessages: Record<string, string> = {
    WITHDRAWN: "탈퇴한 계정입니다. 재가입이 필요합니다.",
    DISABLED: "정지된 계정입니다. 관리자에게 문의하세요.",
    DELETED: "삭제된 계정입니다.",
  }

  if (session.user.status !== "ACTIVE") {
    // 세션 비활성화
    await prisma.authSession.update({
      where: { id: session.id },
      data: { isActive: false },
    })

    throw new Error(
      statusMessages[session.user.status] || "계정 상태가 올바르지 않습니다"
    )
  }

  return { user: session.user, session }
}
