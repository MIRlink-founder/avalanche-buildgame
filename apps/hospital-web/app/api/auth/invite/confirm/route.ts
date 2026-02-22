import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@mire/database';

function isValidPassword(value: string): boolean {
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[@$!%*#?&]/.test(value);
  return hasLetter && hasNumber && hasSpecial;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenValue = searchParams.get('token');
    if (!tokenValue) {
      return NextResponse.json(
        { valid: false, error: '토큰이 없습니다.', reason: 'invalid' },
        { status: 400 },
      );
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token: tokenValue },
      include: { hospital: true, user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.tokenType !== 'INVITATION' ||
      tokenRecord.isUsed ||
      !tokenRecord.hospitalId ||
      !tokenRecord.hospital
    ) {
      return NextResponse.json(
        { valid: false, error: '유효하지 않은 링크입니다.', reason: 'invalid' },
        { status: 400 },
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json(
        {
          valid: false,
          error: '초대 링크의 유효기간이 만료되었습니다.',
          reason: 'expired',
        },
        { status: 400 },
      );
    }

    const hospital = tokenRecord.hospital;
    const email = tokenRecord.user?.email ?? tokenRecord.email ?? '';
    const name = tokenRecord.user?.name ?? '';
    const hospitalName = hospital.displayName ?? hospital.officialName;
    const role = tokenRecord.user?.role ?? 'DEPT_ADMIN';

    return NextResponse.json({
      valid: true,
      hospitalName,
      email,
      name,
      role,
    });
  } catch (error) {
    console.error('초대 토큰 검증 실패:', error);
    return NextResponse.json(
      {
        valid: false,
        error: '검증 중 오류가 발생했습니다.',
        reason: 'invalid',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      token: tokenValue,
      password,
      passwordConfirm,
      name,
    } = body as {
      token?: string;
      password?: string;
      passwordConfirm?: string;
      name?: string;
    };

    if (!tokenValue || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: '토큰과 비밀번호를 모두 입력해주세요.' },
        { status: 400 },
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 400 },
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error: '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.',
        },
        { status: 400 },
      );
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token: tokenValue },
      include: { user: true, hospital: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.tokenType !== 'INVITATION' ||
      tokenRecord.isUsed ||
      !tokenRecord.hospitalId ||
      !tokenRecord.hospital
    ) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 링크입니다.' },
        { status: 400 },
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      return NextResponse.json(
        { error: '초대 링크가 만료되었습니다.' },
        { status: 400 },
      );
    }

    if (!tokenRecord.userId || !tokenRecord.user) {
      return NextResponse.json(
        { error: '초대된 계정을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (tokenRecord.user.status !== 'PENDING') {
      return NextResponse.json(
        { error: '이미 활성화된 계정입니다. 로그인해주세요.' },
        { status: 400 },
      );
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const finalName = name?.trim() || tokenRecord.user.name;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash,
          status: 'ACTIVE',
          statusChangedAt: new Date(),
          name: finalName,
        },
      }),
      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('초대 계정 활성화 실패:', error);
    return NextResponse.json(
      { error: '초대 계정 활성화 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
