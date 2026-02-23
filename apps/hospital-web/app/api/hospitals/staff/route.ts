import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@mire/database';
import { requireAuth, AuthError } from '@/lib/auth-guard';
import { sendInvitationEmail } from '@/lib/send-email';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const HOSPITAL_ROLES = new Set(['MASTER_ADMIN']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_TOKEN_EXPIRY_HOURS = 72;
const STATUS_FILTERS = new Set(['ACTIVE', 'PENDING', 'DISABLED', 'WITHDRAWN']);

/** 병원 소속 계정(직원) 목록 조회 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    if (!HOSPITAL_ROLES.has(user.role)) {
      return NextResponse.json(
        { error: '병원 계정 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    const rawStatus = request.nextUrl.searchParams.get('status')?.trim() ?? '';
    const statusList = rawStatus
      .split(',')
      .map((status) => status.trim().toUpperCase())
      .filter(Boolean);
    const validStatusList = statusList.filter((status) =>
      STATUS_FILTERS.has(status),
    );
    const page = Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10),
    );
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        parseInt(
          request.nextUrl.searchParams.get('pageSize') ??
            String(DEFAULT_PAGE_SIZE),
          10,
        ),
      ),
    );
    const skip = (page - 1) * pageSize;

    const statusWhere =
      validStatusList.length === 1
        ? { status: validStatusList[0] }
        : validStatusList.length > 1
          ? { status: { in: validStatusList } }
          : {};

    const where = {
      hospitalId: user.hospitalId,
      ...statusWhere,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [totalCount, users, statusGroups] = await Promise.all([
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
      prisma.user.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { hospitalId: user.hospitalId },
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

    const summary = statusGroups.reduce(
      (acc, row) => {
        const count = row._count.status;
        acc.total += count;
        if (row.status === 'ACTIVE') acc.active += count;
        if (row.status === 'PENDING') acc.pending += count;
        if (row.status === 'DISABLED') acc.disabled += count;
        if (row.status === 'WITHDRAWN') acc.withdrawn += count;
        return acc;
      },
      { total: 0, active: 0, pending: 0, disabled: 0, withdrawn: 0 },
    );

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
      summary,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 직원 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '직원 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

/** 직원 초대 링크 생성 */
export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: '마스터 관리자만 초대할 수 있습니다.' },
        { status: 403 },
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: '이름을 입력해주세요.' },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: '이메일 형식을 확인해주세요.' },
        { status: 400 },
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: user.hospitalId },
      select: { officialName: true, displayName: true },
    });
    if (!hospital) {
      return NextResponse.json(
        { error: '병원 정보를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const hospitalName = hospital.displayName ?? hospital.officialName;
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const expiresAt = new Date(
      Date.now() + INVITATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    const tokenValue = randomUUID();

    if (existingUser) {
      if (existingUser.hospitalId !== user.hospitalId) {
        return NextResponse.json(
          { error: '이미 사용 중인 이메일입니다.' },
          { status: 409 },
        );
      }

      if (existingUser.status !== 'PENDING') {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다.' },
          { status: 400 },
        );
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: existingUser.id },
          data: { name },
        }),
        prisma.token.updateMany({
          where: {
            userId: existingUser.id,
            tokenType: 'INVITATION',
            isUsed: false,
          },
          data: { isUsed: true },
        }),
        prisma.token.create({
          data: {
            tokenType: 'INVITATION',
            token: tokenValue,
            userId: existingUser.id,
            hospitalId: user.hospitalId,
            email,
            expiresAt,
          },
        }),
      ]);

      let mailSent = false;
      try {
        await sendInvitationEmail({
          to: email,
          hospitalName,
          invitedBy: user.name,
          token: tokenValue,
          expiresInHours: INVITATION_TOKEN_EXPIRY_HOURS,
        });
        mailSent = true;
      } catch (mailError) {
        console.error('직원 초대 메일 발송 실패:', mailError);
      }

      return NextResponse.json({ success: true, mailSent, reInvited: true });
    }

    const passwordHash = bcrypt.hashSync(randomBytes(16).toString('hex'), 10);

    const invitedUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'DEPT_ADMIN',
        status: 'PENDING',
        hospitalId: user.hospitalId,
      },
    });

    await prisma.token.create({
      data: {
        tokenType: 'INVITATION',
        token: tokenValue,
        userId: invitedUser.id,
        hospitalId: user.hospitalId,
        email,
        expiresAt,
      },
    });

    let mailSent = false;
    try {
      await sendInvitationEmail({
        to: email,
        hospitalName,
        invitedBy: user.name,
        token: tokenValue,
        expiresInHours: INVITATION_TOKEN_EXPIRY_HOURS,
      });
      mailSent = true;
    } catch (mailError) {
      console.error('직원 초대 메일 발송 실패:', mailError);
    }

    return NextResponse.json({ success: true, mailSent });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('직원 초대 처리 실패:', error);
    return NextResponse.json(
      { error: '직원 초대 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
