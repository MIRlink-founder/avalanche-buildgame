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
    const includeAll = searchParams.get('scope') === 'all';

    // 1. 통계 데이터 (Hospital.status 기준)
    const [
      pendingCount,
      activeCount,
      newThisMonthCount,
      totalHospitalCount,
      withdrawnCount,
    ] = await Promise.all([
      prisma.hospital.count({
        where: { status: 'PENDING' },
      }), // 가입 승인 대기
      prisma.hospital.count({
        where: { status: { in: ['ACTIVE'] } },
      }), // 정상 운영 중
      prisma.hospital.count({
        where: {
          status: { in: ['ACTIVE'] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }), // 이번 달 신규 가입
      prisma.hospital.count({}), // 전체 병원
      prisma.hospital.count({ where: { status: 'WITHDRAWN' } }), // 탈퇴 병원
    ]);

    // 2. 탭 필터 (Hospital.status 기준)
    let whereCondition: {
      status?: string | { in: string[] };
      OR?: Array<{
        officialName?: { contains: string; mode: 'insensitive' };
        displayName?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (includeAll) {
      whereCondition = {};
    } else if (currentTab === 'pending') {
      // 심사
      whereCondition = {
        status: { in: ['PENDING', 'APPROVED', 'REJECTED'] },
      };
    } else if (currentTab === 'active') {
      // 정상
      whereCondition = {
        status: { in: ['ACTIVE'] },
      };
    } else if (currentTab === 'suspended') {
      // 정지/탈퇴
      whereCondition = {
        status: { in: ['DISABLED', 'WITHDRAWN'] },
      };
    } else {
      // 전체
      whereCondition = {
        status: { in: ['ACTIVE', 'DISABLED', 'WITHDRAWN'] },
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

    // 4. 목록 + 총 개수 (계정 생성일 = 해당 병원 User 중 최초 생성일)
    const [hospitalsRaw, totalCount] = await Promise.all([
      prisma.hospital.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          users: {
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      prisma.hospital.count({ where: whereCondition }),
    ]);

    const hospitals = hospitalsRaw.map((h) => ({
      id: h.id,
      officialName: h.officialName,
      displayName: h.displayName,
      ceoName: h.ceoName,
      businessNumber: h.businessNumber,
      managerPhone: h.managerPhone,
      createdAt: h.createdAt,
      status: h.status,
      accountCreatedAt: h.users[0]?.createdAt ?? null,
    }));

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return NextResponse.json({
      hospitals,
      totalCount,
      totalPages,
      pendingCount,
      activeCount,
      newThisMonthCount,
      totalHospitalCount,
      withdrawnCount,
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
