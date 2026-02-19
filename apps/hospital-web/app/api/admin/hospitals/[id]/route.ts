import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';

// 병원 상세 조회 (드로어용, 메모 포함)
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
      include: {
        registrationRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        memos: { orderBy: { createdAt: 'desc' } },
        documents: true,
        users: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
        withdrawalRequests: {
          orderBy: { withdrawalDate: 'desc' },
          take: 1,
          select: { withdrawalDate: true },
        },
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const accountCreatedAt = hospital.users[0]?.createdAt ?? null;
    const withdrawalDate =
      hospital.status === 'WITHDRAWN' && hospital.withdrawalRequests[0]
        ? hospital.withdrawalRequests[0].withdrawalDate
        : null;

    const documents = hospital.documents.map((d) => ({
      id: d.id,
      documentType: d.documentType,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileSize: d.fileSize != null ? Number(d.fileSize) : null,
    }));

    const { users: _u, withdrawalRequests: _w, ...rest } = hospital;
    return NextResponse.json({
      ...rest,
      accountCreatedAt,
      withdrawalDate,
      documents,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 상세 조회 실패:', error);
    return NextResponse.json(
      { error: '상세 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 병원 계정 상태 변경 (정지/활성화)
export async function PATCH(
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

    const body = await request.json();
    const { status: newStatus } = body as { status?: string };

    if (newStatus !== 'ACTIVE' && newStatus !== 'DISABLED') {
      return NextResponse.json(
        { error: 'status는 ACTIVE 또는 DISABLED여야 합니다.' },
        { status: 400 },
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, status: true, users: { select: { id: true } } },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (newStatus === 'DISABLED' && hospital.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '정상 상태인 병원만 정지할 수 있습니다.' },
        { status: 400 },
      );
    }
    if (newStatus === 'ACTIVE' && hospital.status !== 'DISABLED') {
      return NextResponse.json(
        { error: '정지 상태인 병원만 활성화할 수 있습니다.' },
        { status: 400 },
      );
    }

    const userIds = hospital.users.map((u) => u.id);

    await prisma.$transaction([
      prisma.hospital.update({
        where: { id: hospitalId },
        data: { status: newStatus },
      }),
      ...(newStatus === 'DISABLED' && userIds.length > 0
        ? [
            prisma.authSession.updateMany({
              where: { userId: { in: userIds } },
              data: { isActive: false },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 상태 변경 실패:', error);
    return NextResponse.json(
      { error: '상태 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
