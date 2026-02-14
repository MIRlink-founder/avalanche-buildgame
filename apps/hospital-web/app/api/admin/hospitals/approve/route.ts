import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';

// 병원 가입 승인 처리
export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { hospitalId, memo } = body as { hospitalId?: string; memo?: string };

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'hospitalId가 필요합니다.' },
        { status: 400 },
      );
    }

    const reviewerId = user.id;

    await prisma.$transaction([
      prisma.registrationRequest.updateMany({
        where: {
          hospitalId,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      }),
      prisma.hospital.update({
        where: { id: hospitalId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    if (memo != null && String(memo).trim()) {
      await prisma.hospitalMemo.create({
        data: {
          hospitalId,
          authorId: reviewerId,
          content: String(memo).trim(),
        },
      });
    }

    revalidatePath('/admin/hospitals');
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 승인 실패:', error);
    return NextResponse.json(
      { success: false, error: '승인 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
