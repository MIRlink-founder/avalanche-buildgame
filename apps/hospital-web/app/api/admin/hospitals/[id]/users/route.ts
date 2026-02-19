import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/** 병원 소속 계정(사용자) 목록 조회 - 검색(이름/이메일 부분 일치), 페이징, 부서·최근 접속 */
export async function GET(
  request: NextRequest,
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

    const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    const page = Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10),
    );
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        parseInt(request.nextUrl.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10),
      ),
    );
    const skip = (page - 1) * pageSize;

    const where = {
      hospitalId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          statusChangedAt: true,
          createdAt: true,
          department: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
    ]);

    const userIds = users.map((u) => u.id);
    const lastAccessRows = await prisma.authSession.groupBy({
      by: ['userId'],
      _max: { createdAt: true },
      where: { userId: { in: userIds } },
    });
    const lastAccessByUser = new Map(
      lastAccessRows.map((r) => [r.userId, r._max.createdAt]),
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        departmentName: u.department?.name ?? null,
        statusChangedAt: u.statusChangedAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        lastAccessAt: lastAccessByUser.get(u.id)?.toISOString() ?? null,
      })),
      totalCount,
      totalPages,
      pageSize,
      page,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 계정 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '계정 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
