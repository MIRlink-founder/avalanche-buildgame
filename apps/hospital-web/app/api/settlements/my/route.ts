import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, requireAuth, isAdminRole } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 병원 측 자기 정산 조회
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);

    if (isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '병원 관리자만 접근 가능합니다.' },
        { status: 403 },
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year')?.trim();

    const where: Record<string, unknown> = { hospitalId: user.hospitalId };
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

    // 페이백 비율 조회
    const hospital = await prisma.hospital.findUnique({
      where: { id: user.hospitalId },
      select: {
        paybackRate: true,
        paybackRateUpdatedAt: true,
      },
    });

    // 시스템 기본 비율
    const defaultRateConfig = await prisma.systemConfig.findUnique({
      where: { key: 'DEFAULT_PAYBACK_RATE' },
    });

    const paybackRate = hospital?.paybackRate
      ? Number(hospital.paybackRate)
      : defaultRateConfig
        ? Number(defaultRateConfig.value)
        : 5.0;

    return NextResponse.json({
      data: settlements,
      summary,
      paybackRate,
      paybackRateUpdatedAt: hospital?.paybackRateUpdatedAt,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 정산 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 내역 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
