import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';

// 병원 상세 조회 (드로어용, 메모 포함)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { id: hospitalId } = await context.params;
    if (!hospitalId) {
      return NextResponse.json(
        { error: '병원 ID가 필요합니다.' },
        { status: 400 },
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        registrationRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        memos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(hospital);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 상세 조회 실패:', error);
    return NextResponse.json(
      { error: '상세 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
