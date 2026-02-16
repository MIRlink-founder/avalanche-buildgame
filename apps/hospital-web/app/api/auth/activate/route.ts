import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@mire/database';

// 토큰 유효성 검사 (활성화 폼 노출 전)
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
      include: { hospital: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.tokenType !== 'ACTIVATION' ||
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
          error: '인증 링크의 유효기간이 만료되었습니다.',
          reason: 'expired',
        },
        { status: 400 },
      );
    }

    const hospital = tokenRecord.hospital;
    const email = hospital.managerEmail ?? tokenRecord.email ?? '';
    const hospitalName = hospital.displayName ?? hospital.officialName;

    return NextResponse.json({
      valid: true,
      hospitalName,
      email,
    });
  } catch (error) {
    console.error('토큰 검증 실패:', error);
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

// 토큰 검증 후 비밀번호 설정 및 계정 활성화
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token: tokenValue, password, passwordConfirm } = body as {
      token?: string;
      password?: string;
      passwordConfirm?: string;
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

    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 },
      );
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token: tokenValue },
      include: { hospital: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.tokenType !== 'ACTIVATION' ||
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
        { error: '만료된 링크입니다. 관리자에게 재발송을 요청해주세요.' },
        { status: 400 },
      );
    }

    const hospital = tokenRecord.hospital;
    const email = hospital.managerEmail ?? tokenRecord.email;
    if (!email) {
      return NextResponse.json(
        { error: '병원 담당자 이메일 정보가 없습니다.' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 활성화된 계정입니다. 로그인해주세요.' },
        { status: 400 },
      );
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const name = hospital.managerName ?? hospital.officialName;

    await prisma.$transaction([
      prisma.user.create({
        data: {
          hospitalId: hospital.id,
          email,
          passwordHash,
          name,
          role: 'MASTER_ADMIN',
          status: 'ACTIVE',
        },
      }),
      prisma.hospital.update({
        where: { id: hospital.id },
        data: { status: 'APPROVED' },
      }),
      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '계정이 활성화되었습니다. 로그인해주세요.',
    });
  } catch (error) {
    console.error('계정 활성화 실패:', error);
    return NextResponse.json(
      { error: '활성화 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
