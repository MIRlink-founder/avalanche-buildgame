import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@mire/database';
import { sendResetPasswordEmail } from '@/lib/send-email';

export const runtime = 'nodejs';

type ResetTokenPayload = {
  userId: string;
  email: string;
  purpose: 'password_reset';
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
    };

    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: '가입된 이메일을 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '계정 상태가 올바르지 않습니다' },
        { status: 403 },
      );
    }

    const payload: ResetTokenPayload = {
      userId: user.id,
      email: user.email,
      purpose: 'password_reset',
    };

    const resetToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    let mailSent = false;
    try {
      await sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        token: resetToken,
      });
      mailSent = true;
    } catch (mailError) {
      console.error('비밀번호 재설정 메일 발송 실패:', mailError);
    }

    return NextResponse.json({
      success: true,
      mailSent,
      resetLink: mailSent
        ? undefined
        : `/auth/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    console.error('비밀번호 재설정 요청 오류:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 요청 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
