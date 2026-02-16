import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';
import { sendRejectionEmail } from '@/lib/send-email';

// 병원 가입 반려 처리
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
    const { hospitalId, memo } = body as {
      hospitalId?: string;
      memo?: string;
    };

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'hospitalId가 필요합니다.' },
        { status: 400 },
      );
    }

    const existing = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { status: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '병원 정보를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: '승인 대기 상태가 아닙니다.' },
        { status: 400 },
      );
    }

    const reviewerId = user.id;
    const reasonText = memo != null ? String(memo).trim() : '';

    await prisma.$transaction([
      prisma.registrationRequest.updateMany({
        where: {
          hospitalId,
          reviewedAt: null,
        },
        data: {
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: reasonText || null,
        },
      }),
      prisma.hospital.update({
        where: { id: hospitalId },
        data: { status: 'REJECTED' },
      }),
    ]);

    if (reasonText) {
      await prisma.hospitalMemo.create({
        data: {
          hospitalId,
          authorId: reviewerId,
          content: reasonText,
        },
      });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { managerEmail: true, officialName: true, displayName: true },
    });
    let mailSent = false;
    if (hospital?.managerEmail) {
      try {
        await sendRejectionEmail({
          to: hospital.managerEmail,
          hospitalName: hospital.displayName ?? hospital.officialName,
          rejectionReason: reasonText,
        });
        mailSent = true;
      } catch (mailError) {
        console.error('반려 메일 발송 실패:', mailError);
      }
    }

    revalidatePath('/admin/hospitals');
    return NextResponse.json({ success: true, mailSent });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    console.error('병원 반려 실패:', error);
    return NextResponse.json(
      { success: false, error: '반려 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
