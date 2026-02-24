import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, isAdminRole, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 병원별 월별 정산 내역
export async function GET(
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

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year')?.trim();

    const where: Record<string, unknown> = { hospitalId };
    if (year && /^\d{4}$/.test(year)) {
      const yearNum = Number(year);
      where.settlementPeriodStart = {
        gte: new Date(yearNum, 0, 1),
        lt: new Date(yearNum + 1, 0, 1),
      };
    }

    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { settlementPeriodStart: 'desc' },
      select: {
        id: true,
        publicId: true,
        settlementPeriodStart: true,
        settlementPeriodEnd: true,
        totalVolume: true,
        caseCount: true,
        appliedRate: true,
        paybackAmount: true,
        status: true,
        settledAt: true,
        createdAt: true,
      },
    });

    // 요약 집계
    const summary = settlements.reduce(
      (acc, s) => {
        acc.totalPayback += Number(s.paybackAmount);
        acc.totalCaseCount += s.caseCount;
        return acc;
      },
      { totalPayback: 0, totalCaseCount: 0 },
    );

    // 병원 정보 (paybackRate 포함)
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        displayName: true,
        officialName: true,
        paybackRate: true,
        paybackRateUpdatedAt: true,
      },
    });

    return NextResponse.json({
      data: settlements,
      summary,
      hospital,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 정산 내역 조회 오류:', error);
    return NextResponse.json(
      { error: '병원 정산 내역 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
