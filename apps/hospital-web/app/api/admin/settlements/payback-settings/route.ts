import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, isAdminRole, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 개별 페이백 비율 설정된 병원 리스트
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const hospitals = await prisma.hospital.findMany({
      where: {
        paybackRate: { not: null },
      },
      select: {
        id: true,
        displayName: true,
        officialName: true,
        ceoName: true,
        paybackRate: true,
        paybackRateUpdatedAt: true,
        status: true,
      },
      orderBy: { paybackRateUpdatedAt: 'desc' },
    });

    return NextResponse.json({ data: hospitals });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('개별 비율 설정 병원 조회 오류:', error);
    return NextResponse.json(
      { error: '개별 비율 설정 병원 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
