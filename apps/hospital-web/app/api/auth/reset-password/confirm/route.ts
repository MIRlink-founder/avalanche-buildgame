import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@mire/database';

export const runtime = 'nodejs';

function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);
  return hasLetter && hasNumber && hasSpecial;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
    };

    const token = body.token?.trim();
    const rawPassword = body.password ?? '';
    const password = rawPassword.trim();

    if (!token) {
      return NextResponse.json(
        { error: '재설정 토큰이 필요합니다' },
        { status: 400 },
      );
    }

    if (!password || !isValidPassword(password)) {
      return NextResponse.json(
        {
          error: '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.',
        },
        { status: 400 },
      );
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.tokenType !== 'PASSWORD_RESET' ||
      tokenRecord.isUsed ||
      !tokenRecord.userId
    ) {
      return NextResponse.json(
        { error: '재설정 링크가 만료되었거나 올바르지 않습니다' },
        { status: 400 },
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json(
        { error: '재설정 링크가 만료되었거나 올바르지 않습니다' },
        { status: 400 },
      );
    }

    if (!tokenRecord.user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '계정 상태가 올바르지 않습니다' },
        { status: 403 },
      );
    }

    const isSamePassword =
      bcrypt.compareSync(rawPassword, user.passwordHash) ||
      (rawPassword !== password &&
        bcrypt.compareSync(password, user.passwordHash));
    if (isSamePassword) {
      return NextResponse.json(
        { error: '기존 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const hashed = bcrypt.hashSync(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash: hashed },
      }),
      prisma.authSession.updateMany({
        where: { userId: tokenRecord.userId, isActive: true },
        data: { isActive: false },
      }),
      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('비밀번호 재설정 확인 오류:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
