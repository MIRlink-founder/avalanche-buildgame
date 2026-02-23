import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError } from '@/lib/auth-guard';

const HOSPITAL_ROLES = new Set(['MASTER_ADMIN']);

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!HOSPITAL_ROLES.has(user.role)) {
      return NextResponse.json(
        { error: '병원 계정 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const departments = await prisma.department.findMany({
      where: { hospitalId: user.hospitalId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('부서 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '부서 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
