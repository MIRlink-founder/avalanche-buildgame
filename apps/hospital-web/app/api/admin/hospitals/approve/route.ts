import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';
import { sendActivationEmail } from '@/lib/send-email';

const ACTIVATION_TOKEN_EXPIRY_HOURS = 24;

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
    const reviewedAt = new Date();
    const tokenValue = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      reviewedAt.getTime() + ACTIVATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        status: true,
        managerEmail: true,
        officialName: true,
        displayName: true,
      },
    });
    if (!hospital) {
      return NextResponse.json(
        { success: false, error: '병원 정보를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    if (hospital.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: '승인 대기 상태가 아닙니다.' },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.registrationRequest.updateMany({
        where: {
          hospitalId,
          reviewedAt: null,
        },
        data: {
          reviewedBy: reviewerId,
          reviewedAt,
        },
      }),
      prisma.hospital.update({
        where: { id: hospitalId },
        data: { status: 'APPROVED_WAITING' },
      }),
      prisma.token.create({
        data: {
          tokenType: 'ACTIVATION',
          token: tokenValue,
          hospitalId,
          email: hospital.managerEmail ?? undefined,
          expiresAt,
          isUsed: false,
        },
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

    let mailSent = false;
    if (hospital.managerEmail) {
      try {
        await sendActivationEmail({
          to: hospital.managerEmail,
          hospitalName: hospital.displayName ?? hospital.officialName,
          managerEmail: hospital.managerEmail,
          approvedAt: reviewedAt,
          token: tokenValue,
        });
        mailSent = true;
      } catch (mailError) {
        console.error('활성화 메일 발송 실패:', mailError);
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
    console.error('병원 승인 실패:', error);
    return NextResponse.json(
      { success: false, error: '승인 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
