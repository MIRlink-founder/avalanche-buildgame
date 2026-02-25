import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@mire/database';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호를 확인해주세요' },
        { status: 401 },
      );
    }

    // 사용자 상태별 에러 메시지
    const userStatusMessages: Record<string, string> = {
      WITHDRAWN: '탈퇴된 계정입니다. 관리자에게 문의하세요.',
      DISABLED: '운영 정책에 의해 차단된 계정입니다.',
      DELETED: '삭제된 계정입니다.',
    };
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error:
            userStatusMessages[user.status] || '계정 상태가 올바르지 않습니다',
        },
        { status: 403 },
      );
    }
    if (
      user.role === 'MASTER_ADMIN' ||
      (user.role === 'DEPT_ADMIN' && user.hospitalId)
    ) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: user.hospitalId! },
      });
      if (!hospital) {
        return NextResponse.json(
          { error: '병원 정보를 찾을 수 없습니다.' },
          { status: 403 },
        );
      }
      if (hospital.status !== 'ACTIVE') {
        const hospitalStatusMessages: Record<string, string> = {
          PENDING: '아직 승인되지 않았습니다.',
          APPROVED: '비밀번호 설정이 완료되지 않았습니다.',
          REJECTED: '운영사에 의해 반려되었습니다.',
          DISABLED: '계정이 정지되었습니다.',
          WITHDRAWN: '탈퇴된 계정입니다.',
        };
        return NextResponse.json(
          {
            error:
              hospitalStatusMessages[hospital.status] ||
              '병원 상태가 올바르지 않습니다.',
          },
          { status: 403 },
        );
      }
    }

    // JWT 생성
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' },
    );

    // Auth Session 생성
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        accessToken,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
