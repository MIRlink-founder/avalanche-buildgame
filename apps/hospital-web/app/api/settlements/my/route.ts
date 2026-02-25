import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, requireAuth, isAdminRole } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 병원 측 자기 정산 조회 (페이지네이션 + 계좌정보 + 이번 달 집계)
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
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '5')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { hospitalId: user.hospitalId };
    if (year && /^\d{4}$/.test(year)) {
      const yearNum = Number(year);
      where.settlementPeriodStart = {
        gte: new Date(yearNum, 0, 1),
        lt: new Date(yearNum + 1, 0, 1),
      };
    }

    // 총 개수 + 페이지네이션된 정산 내역
    const [total, settlements] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.findMany({
        where,
        orderBy: { settlementPeriodStart: 'desc' },
        skip,
        take: limit,
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
      }),
    ]);

    // 요약 집계 (해당 연도 전체)
    const allSettlements = await prisma.settlement.findMany({
      where,
      select: { paybackAmount: true, caseCount: true },
    });
    const summary = allSettlements.reduce(
      (acc, s) => {
        acc.totalPayback += Number(s.paybackAmount);
        acc.totalCaseCount += s.caseCount;
        return acc;
      },
      { totalPayback: 0, totalCaseCount: 0 },
    );

    // 병원 정보 (페이백 비율 + 계좌)
    const hospital = await prisma.hospital.findUnique({
      where: { id: user.hospitalId },
      select: {
        paybackRate: true,
        paybackRateUpdatedAt: true,
        accountBank: true,
        accountNumber: true,
        accountHolder: true,
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

    // SETTLEMENT_PAYMENT_DAY 기준 다음 지급 예정일 계산
    const paymentDayConfig = await prisma.systemConfig.findUnique({
      where: { key: 'SETTLEMENT_PAYMENT_DAY' },
    });
    const paymentDayRaw = paymentDayConfig
      ? Number(paymentDayConfig.value)
      : 25;
    const paymentDay = Number.isFinite(paymentDayRaw)
      ? Math.min(28, Math.max(1, Math.floor(paymentDayRaw)))
      : 25;

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let nextPayment = new Date(y, m, paymentDay);
    if (now.getTime() > nextPayment.getTime()) {
      nextPayment = new Date(y, m + 1, paymentDay);
    }
    const diffMs = nextPayment.getTime() - now.getTime();
    const dDay = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const nextPaymentDateString = `${nextPayment.getMonth() + 1}월 ${nextPayment.getDate()}일`;

    // 이번 달 PENDING 정산 (집계 중 상태)
    const currentMonthStart = new Date(y, m, 1);
    const nextMonthStart = new Date(y, m + 1, 1);

    const currentMonthSettlement = await prisma.settlement.findFirst({
      where: {
        hospitalId: user.hospitalId,
        status: 'PENDING',
        settlementPeriodStart: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
      select: {
        paybackAmount: true,
        caseCount: true,
        settlementPeriodStart: true,
        settlementPeriodEnd: true,
      },
    });

    return NextResponse.json({
      data: settlements,
      total,
      page,
      limit,
      summary,
      paybackRate,
      paybackRateUpdatedAt: hospital?.paybackRateUpdatedAt,
      account: {
        accountBank: hospital?.accountBank ?? null,
        accountNumber: hospital?.accountNumber ?? null,
        accountHolder: hospital?.accountHolder ?? null,
      },
      nextPaymentDate: {
        dateString: nextPaymentDateString,
        dDay,
      },
      paymentDayOfMonth: paymentDay,
      currentMonth: currentMonthSettlement
        ? {
            paybackAmount: Number(currentMonthSettlement.paybackAmount),
            caseCount: currentMonthSettlement.caseCount,
            periodStart: currentMonthSettlement.settlementPeriodStart,
            periodEnd: currentMonthSettlement.settlementPeriodEnd,
          }
        : null,
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
