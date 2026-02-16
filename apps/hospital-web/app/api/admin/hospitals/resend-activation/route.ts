import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';
// import { sendActivationEmail } from '@/lib/send-email';

// APPROVED_WAITING 상태에서 활성화 메일 재발송
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
    const { hospitalId } = body as { hospitalId?: string };

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'hospitalId가 필요합니다.' },
        { status: 400 },
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId, status: 'APPROVED_WAITING' },
      select: { id: true, managerEmail: true, officialName: true, displayName: true },
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: '승인 대기 중인 병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const tokenRecord = await prisma.token.findFirst({
      where: {
        hospitalId,
        tokenType: 'ACTIVATION',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: '유효한 활성화 토큰이 없거나 만료되었습니다.' },
        { status: 400 },
      );
    }

    if (!hospital.managerEmail) {
      return NextResponse.json(
        { success: false, error: '병원 담당자 이메일이 없습니다.' },
        { status: 400 },
      );
    }

    // 활성화 메일 재발송 (SMTP 설정 후 주석 해제)
    // try {
    //   await sendActivationEmail({
    //     to: hospital.managerEmail,
    //     hospitalName: hospital.displayName ?? hospital.officialName,
    //     managerEmail: hospital.managerEmail,
    //     approvedAt: tokenRecord.createdAt ?? new Date(),
    //     token: tokenRecord.token,
    //   });
    // } catch (mailError) {
    //   console.error('활성화 메일 재발송 실패:', mailError);
    //   return NextResponse.json(
    //     { success: false, error: '메일 발송에 실패했습니다.' },
    //     { status: 500 },
    //   );
    // }

    revalidatePath('/admin/hospitals');
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    console.error('활성화 메일 재발송 실패:', error);
    return NextResponse.json(
      { success: false, error: '재발송 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
