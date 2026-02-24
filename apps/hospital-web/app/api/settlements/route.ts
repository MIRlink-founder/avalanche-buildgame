import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import {
  AuthError,
  isAdminRole,
  requireAuth,
  resolveHospitalId,
} from '@/lib/auth-guard';

export const runtime = 'nodejs';

const SETTLEMENT_STATUSES = new Set(['PENDING_PAYMENT', 'SETTLED']);

function getPositiveInt(value: string | null) {
  if (!value) {
    return null;
  }
  if (!/^[0-9]+$/.test(value.trim())) {
    return null;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  return parsed > 0 ? parsed : null;
}

function getLimit(value: string | null) {
  if (!value) {
    return 20;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }
  return Math.min(parsed, 100);
}

function getDate(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const requestedHospitalId = searchParams.get('hospitalId')?.trim() || '';
    const hospitalName = searchParams.get('hospitalName')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const cursor = getPositiveInt(searchParams.get('cursor'));
    const limit = getLimit(searchParams.get('limit'));
    const periodFrom = getDate(searchParams.get('periodFrom'));
    const periodTo = getDate(searchParams.get('periodTo'));
    const createdFrom = getDate(searchParams.get('createdFrom'));
    const createdTo = getDate(searchParams.get('createdTo'));

    let hospitalId = '';
    let hospitalIds: string[] = [];

    if (isAdminRole(user.role)) {
      if (requestedHospitalId) {
        hospitalId = requestedHospitalId;
      } else if (hospitalName) {
        const matchedHospitals = await prisma.hospital.findMany({
          where: {
            OR: [
              {
                displayName: {
                  contains: hospitalName,
                  mode: 'insensitive',
                },
              },
              {
                officialName: {
                  contains: hospitalName,
                  mode: 'insensitive',
                },
              },
            ],
          },
          select: { id: true },
          take: 50,
        });

        if (matchedHospitals.length === 0) {
          return NextResponse.json(
            { error: '병원명을 찾을 수 없습니다' },
            { status: 404 },
          );
        }

        hospitalIds = matchedHospitals
          .map((hospital) => hospital.id)
          .filter(Boolean);
      } else {
        hospitalId = '';
      }
    } else {
      hospitalId = resolveHospitalId(user, requestedHospitalId || null);
    }

    if (status && !SETTLEMENT_STATUSES.has(status)) {
      return NextResponse.json(
        { error: '정산 상태 값이 올바르지 않습니다' },
        { status: 400 },
      );
    }

    if (
      (searchParams.has('periodFrom') && !periodFrom) ||
      (searchParams.has('periodTo') && !periodTo) ||
      (searchParams.has('createdFrom') && !createdFrom) ||
      (searchParams.has('createdTo') && !createdTo)
    ) {
      return NextResponse.json(
        { error: '날짜 형식이 올바르지 않습니다' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {};

    if (hospitalIds.length > 0) {
      where.hospitalId =
        hospitalIds.length === 1 ? hospitalIds[0] : { in: hospitalIds };
    } else if (hospitalId) {
      where.hospitalId = hospitalId;
    }

    if (status) {
      where.status = status;
    }

    if (periodFrom || periodTo) {
      where.settlementPeriodStart = {
        ...(periodFrom ? { gte: periodFrom } : {}),
      };
      where.settlementPeriodEnd = {
        ...(periodTo ? { lte: periodTo } : {}),
      };
    }

    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        publicId: true,
        hospitalId: true,
        settlementPeriodStart: true,
        settlementPeriodEnd: true,
        totalVolume: true,
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
          },
        },
      },
    });

    const hasMore = settlements.length > limit;
    const data = hasMore ? settlements.slice(0, limit) : settlements;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return NextResponse.json({ data, nextCursor });
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
