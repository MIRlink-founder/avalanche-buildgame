import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import {
  AuthError,
  isAdminRole,
  requireAuth,
  resolveHospitalId,
} from '@/lib/auth-guard';

export const runtime = 'nodejs';

function getPositiveInt(value: string | null) {
  if (!value) return null;
  if (!/^[0-9]+$/.test(value.trim())) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return parsed > 0 ? parsed : null;
}

function getLimit(value: string | null) {
  if (!value) return 20;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(parsed, 100);
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const requestedHospitalId = searchParams.get('hospitalId')?.trim() || '';
    const hospitalName = searchParams.get('hospitalName')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';
    const month = searchParams.get('month')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const page = getPositiveInt(searchParams.get('page')) ?? 1;
    const limit = getLimit(searchParams.get('limit'));

    let hospitalId = '';
    let hospitalIds: string[] = [];

    if (isAdminRole(user.role)) {
      if (requestedHospitalId) {
        hospitalId = requestedHospitalId;
      } else if (hospitalName || search) {
        const query = hospitalName || search;
        const matchedHospitals = await prisma.hospital.findMany({
          where: {
            OR: [
              { displayName: { contains: query, mode: 'insensitive' } },
              { officialName: { contains: query, mode: 'insensitive' } },
              { accountHolder: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
          take: 50,
        });

        if (matchedHospitals.length === 0) {
          return NextResponse.json({
            data: [],
            total: 0,
            page,
            limit,
            summary: { totalVolume: 0, avgRate: 0, totalPayback: 0, hospitalCount: 0 },
          });
        }

        hospitalIds = matchedHospitals.map((h) => h.id);
      }
    } else {
      hospitalId = resolveHospitalId(user, requestedHospitalId || null);
    }

    const where: Record<string, unknown> = {};

    if (hospitalIds.length > 0) {
      where.hospitalId = hospitalIds.length === 1 ? hospitalIds[0] : { in: hospitalIds };
    } else if (hospitalId) {
      where.hospitalId = hospitalId;
    }

    if (status) {
      where.status = status;
    }

    // month 필터 (YYYY-MM 형식)
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split('-');
      const year = Number(yearStr);
      const mon = Number(monthStr);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0);
      where.settlementPeriodStart = { gte: start };
      where.settlementPeriodEnd = { lte: end };
    }

    // 총 개수
    const total = await prisma.settlement.count({ where });

    // 오프셋 페이지네이션
    const skip = (page - 1) * limit;
    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        publicId: true,
        hospitalId: true,
        settlementPeriodStart: true,
        settlementPeriodEnd: true,
        totalVolume: true,
        caseCount: true,
        appliedRate: true,
        paybackAmount: true,
        isNftBoosted: true,
        status: true,
        settledAt: true,
        createdAt: true,
        hospital: {
          select: {
            id: true,
            displayName: true,
            officialName: true,
            businessNumber: true,
            accountBank: true,
            accountNumber: true,
            accountHolder: true,
          },
        },
      },
    });

    // 요약 집계 (해당 필터 전체 기준)
    const allForSummary = await prisma.settlement.findMany({
      where,
      select: {
        totalVolume: true,
        appliedRate: true,
        paybackAmount: true,
        hospitalId: true,
      },
    });

    const hospitalSet = new Set<string>();
    let totalVolume = 0;
    let totalPayback = 0;
    let rateSum = 0;
    for (const s of allForSummary) {
      totalVolume += Number(s.totalVolume);
      totalPayback += Number(s.paybackAmount);
      rateSum += Number(s.appliedRate);
      hospitalSet.add(s.hospitalId);
    }

    const avgRate = allForSummary.length > 0 ? rateSum / allForSummary.length : 0;

    return NextResponse.json({
      data: settlements,
      total,
      page,
      limit,
      summary: {
        totalVolume,
        avgRate: Number(avgRate.toFixed(2)),
        totalPayback,
        hospitalCount: hospitalSet.size,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('정산 내역 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 내역 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
