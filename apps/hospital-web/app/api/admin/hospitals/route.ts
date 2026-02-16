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

    // 1. 통계 데이터 (Hospital.status 기준)
    const [pendingCount, activeCount, newThisMonthCount] = await Promise.all([
      prisma.hospital.count({
        where: { status: 'PENDING' },
      }),
      prisma.hospital.count({
        where: { status: { in: ['ACTIVE', 'APPROVED', 'APPROVED_WAITING'] } },
      }),
      prisma.hospital.count({
        where: {
          status: { in: ['ACTIVE', 'APPROVED', 'APPROVED_WAITING'] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // 2. 탭 필터 (Hospital.status 기준)
    let whereCondition: {
      status?: string | { in: string[] };
      OR?: Array<{
        officialName?: { contains: string; mode: 'insensitive' };
        displayName?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (currentTab === 'pending') {
      whereCondition = {
        status: { in: ['PENDING', 'REJECTED'] },
      };
    } else if (currentTab === 'active') {
      whereCondition = { status: { in: ['ACTIVE', 'APPROVED', 'APPROVED_WAITING'] } };
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

    // 4. 목록 + 총 개수 (상세/메모는 드로어에서 GET [id]로 로드, 상태는 Hospital.status만 사용)
    const [hospitals, totalCount] = await Promise.all([
      prisma.hospital.findMany({
        where: whereCondition,
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
