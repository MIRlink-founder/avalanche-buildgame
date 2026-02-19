import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@mire/database';

export const runtime = 'nodejs';

type ResetTokenPayload = {
  userId: string;
  email: string;
  purpose: 'password_reset';
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
    };

    const token = body.token?.trim();
    const password = body.password?.trim();

    if (!token) {
      return NextResponse.json(
        { error: '재설정 토큰이 필요합니다' },
        { status: 400 },
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다' },
        { status: 400 },
      );
    }

    let payload: ResetTokenPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as ResetTokenPayload;
    } catch (error) {
      return NextResponse.json(
        { error: '재설정 링크가 만료되었거나 올바르지 않습니다' },
        { status: 400 },
      );
    }

    if (payload.purpose !== 'password_reset') {
      return NextResponse.json(
        { error: '재설정 토큰이 올바르지 않습니다' },
        { status: 400 },
      );
    }

    const hashed = bcrypt.hashSync(password, 10);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('비밀번호 재설정 확인 오류:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
