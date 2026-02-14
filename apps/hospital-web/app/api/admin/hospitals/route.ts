import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';

const PAGE_SIZE = 10;

// 병원 목록 + 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const currentPage = Number(searchParams.get('page')) || 1;
    const currentTab = searchParams.get('tab') || 'pending';
    const searchTerm = searchParams.get('search') || '';

    // 1. 통계 데이터
    const [pendingCount, activeCount, newThisMonthCount] = await Promise.all([
      prisma.registrationRequest.count({
        where: { status: 'PENDING' },
      }),
      prisma.hospital.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.hospital.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // 2. 탭 필터
    let whereCondition: {
      registrationRequests?: { some: { status: string } };
      status?: string | { in: string[] };
      OR?: Array<{
        officialName?: { contains: string; mode: 'insensitive' };
        displayName?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (currentTab === 'pending') {
      whereCondition = {
        registrationRequests: { some: { status: 'PENDING' } },
      };
    } else if (currentTab === 'active') {
      whereCondition = { status: 'ACTIVE' };
    } else if (currentTab === 'suspended') {
      whereCondition = {
        status: { in: ['DISABLED', 'WITHDRAWN'] },
      };
    }

    // 3. 검색
    if (searchTerm) {
      whereCondition = {
        ...whereCondition,
        OR: [
          { officialName: { contains: searchTerm, mode: 'insensitive' } },
          { displayName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };
    }

    // 4. 목록 + 총 개수
    const [hospitals, totalCount] = await Promise.all([
      prisma.hospital.findMany({
        where: whereCondition,
        include: {
          registrationRequests: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          memos: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.hospital.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return NextResponse.json({
      hospitals,
      totalCount,
      totalPages,
      pendingCount,
      activeCount,
      newThisMonthCount,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
