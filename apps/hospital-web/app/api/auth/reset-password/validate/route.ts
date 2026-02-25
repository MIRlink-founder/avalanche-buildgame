import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenValue = searchParams.get('token');
    if (!tokenValue) {
      return NextResponse.json(
        { valid: false, reason: 'invalid' },
        { status: 400 },
      );
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token: tokenValue },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.tokenType !== 'PASSWORD_RESET' ||
      tokenRecord.isUsed ||
      !tokenRecord.userId ||
      !tokenRecord.user
    ) {
      return NextResponse.json(
        { valid: false, reason: 'invalid' },
        { status: 400 },
      );
    }

    const email = tokenRecord.user.email;

    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json(
        { valid: false, reason: 'expired', email },
        { status: 400 },
      );
    }

    return NextResponse.json({ valid: true, email });
  } catch (error) {
    console.error('비밀번호 초기화 토큰 검증 실패:', error);
    return NextResponse.json(
      { valid: false, reason: 'invalid' },
      { status: 500 },
    );
  }
}
