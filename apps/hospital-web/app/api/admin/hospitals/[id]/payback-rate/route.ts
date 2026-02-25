import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, isAdminRole, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 개별 병원 페이백 비율 설정
export async function PATCH(
  request: Request,
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

    const body = (await request.json().catch(() => ({}))) as {
      paybackRate?: number | string | null;
    };

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // null이면 시스템 기본값으로 리셋
    if (body.paybackRate === null || body.paybackRate === undefined) {
      const updated = await prisma.hospital.update({
        where: { id: hospitalId },
        data: {
          paybackRate: null,
          paybackRateUpdatedAt: new Date(),
        },
        select: {
          id: true,
          paybackRate: true,
          paybackRateUpdatedAt: true,
        },
      });
      return NextResponse.json({ data: updated });
    }

    const rate = Number(body.paybackRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: '비율은 0에서 100 사이 숫자여야 합니다' },
        { status: 400 },
      );
    }

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        paybackRate: rate.toFixed(2),
        paybackRateUpdatedAt: new Date(),
      },
      select: {
        id: true,
        paybackRate: true,
        paybackRateUpdatedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 비율 설정 오류:', error);
    return NextResponse.json(
      { error: '병원 비율 설정 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
