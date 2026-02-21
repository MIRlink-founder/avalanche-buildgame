import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError } from '@/lib/auth-guard';

const HOSPITAL_ROLES = new Set(['MASTER_ADMIN', 'DEPT_ADMIN']);
const ALLOWED_STATUS = new Set(['ACTIVE', 'DISABLED', 'WITHDRAWN']);
const ALLOWED_ROLES = new Set(['MASTER_ADMIN', 'DEPT_ADMIN']);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth(request);
    if (!HOSPITAL_ROLES.has(user.role)) {
      return NextResponse.json(
        { error: '병원 계정 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    if (user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: '마스터 관리자만 수정할 수 있습니다.' },
        { status: 403 },
      );
    }

    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: '직원 ID가 필요합니다.' },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      name?: string;
      role?: string;
    };

    const status = body.status?.trim().toUpperCase();
    const role = body.role?.trim().toUpperCase();
    const name = body.name?.trim();

    if (status && !ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { error: '변경할 상태가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (role && !ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { error: '변경할 권한이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (body.name !== undefined && !name) {
      return NextResponse.json(
        { error: '이름을 입력해주세요.' },
        { status: 400 },
      );
    }

    if (user.id === id) {
      return NextResponse.json(
        { error: '내 계정은 직접 변경할 수 없습니다.' },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, hospitalId: user.hospitalId },
      select: { id: true, role: true, status: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: '직원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    if (targetUser.role === 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: '마스터 관리자 계정은 변경할 수 없습니다.' },
        { status: 403 },
      );
    }

    const updateData: {
      status?: string;
      statusChangedAt?: Date;
      name?: string;
      role?: string;
    } = {};

    if (status) {
      updateData.status = status;
      updateData.statusChangedAt = new Date();
    }

    if (name) {
      updateData.name = name;
    }

    if (role) {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '변경할 정보가 없습니다.' },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: targetUser.id },
        data: updateData,
        select: {
          id: true,
          status: true,
          statusChangedAt: true,
          name: true,
          role: true,
        },
      });

      if (status && status !== 'ACTIVE') {
        await tx.authSession.updateMany({
          where: { userId: targetUser.id, isActive: true },
          data: { isActive: false },
        });
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        status: updated.status,
        statusChangedAt: updated.statusChangedAt?.toISOString() ?? null,
        name: updated.name,
        role: updated.role,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 직원 상태 변경 실패:', error);
    return NextResponse.json(
      { error: '직원 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
