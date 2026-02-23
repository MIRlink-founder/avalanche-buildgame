import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request);

    const now = new Date();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { status: 'WITHDRAWN', statusChangedAt: now },
      }),
      prisma.authSession.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('계정 탈퇴 처리 실패:', error);
    return NextResponse.json(
      { error: '계정 탈퇴 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
