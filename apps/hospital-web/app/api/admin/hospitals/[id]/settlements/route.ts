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
    const pageRaw = searchParams.get('page')?.trim();
    const pageSizeRaw = searchParams.get('pageSize')?.trim();

    const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(pageSizeRaw ?? '10', 10) || 10),
    );

    const where = {
      hospitalId,
      ...(year && /^\d{4}$/.test(year)
        ? {
            settlementPeriodStart: {
              gte: new Date(Number(year), 0, 1),
              lt: new Date(Number(year) + 1, 0, 1),
            },
          }
        : {}),
    };

    const [totalCount, aggregateResult, settlements] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.aggregate({
        where,
        // 스키마에 caseCount 있음 (Prisma generate 반영 시 타입 제거 가능)
        _sum: { paybackAmount: true, caseCount: true } as {
          paybackAmount: true;
          caseCount: true;
        },
      }),
      prisma.settlement.findMany({
        where,
        orderBy: { settlementPeriodStart: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
        } as { id: true; publicId: true; settlementPeriodStart: true; settlementPeriodEnd: true; totalVolume: true; caseCount: true; appliedRate: true; paybackAmount: true; status: true; settledAt: true; createdAt: true },
      }),
    ]);

    // 요약 집계 (해당 연도 전체)
    const sum = aggregateResult._sum as
      | { paybackAmount?: unknown; caseCount?: number }
      | undefined;
    const summary = {
      totalPayback: Number(sum?.paybackAmount ?? 0),
      totalCaseCount: sum?.caseCount ?? 0,
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // 병원 정보 (paybackRate 포함)
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        displayName: true,
        officialName: true,
        paybackRate: true,
        paybackRateUpdatedAt: true,
      } as { id: true; displayName: true; officialName: true; paybackRate: true; paybackRateUpdatedAt: true },
    });

    return NextResponse.json({
      data: settlements,
      summary,
      hospital,
      pagination: {
        totalCount,
        totalPages,
        pageSize,
        currentPage: page,
      },
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
