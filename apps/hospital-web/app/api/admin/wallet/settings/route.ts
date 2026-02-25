import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';

const DEFAULT_MIN_BALANCE = '10';
const DEFAULT_EMAIL = 'admin@mire.com';

/** 알림 임계치 설정 조회 */
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const row = await prisma.walletNotificationSetting.findFirst({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      minBalanceAvax: row?.minBalanceAvax ?? DEFAULT_MIN_BALANCE,
      notificationEmail: row?.notificationEmail ?? DEFAULT_EMAIL,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: '설정을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

/** 알림 임계치 설정 저장 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const minBalanceAvax =
      typeof body.minBalanceAvax === 'string' &&
      /^\d+(\.\d+)?$/.test(body.minBalanceAvax)
        ? body.minBalanceAvax
        : DEFAULT_MIN_BALANCE;
    const notificationEmail =
      typeof body.notificationEmail === 'string' &&
      body.notificationEmail.trim().length > 0
        ? body.notificationEmail.trim()
        : DEFAULT_EMAIL;

    const row = await prisma.walletNotificationSetting.findFirst({
      orderBy: { id: 'asc' },
    });

    if (row) {
      await prisma.walletNotificationSetting.update({
        where: { id: row.id },
        data: { minBalanceAvax, notificationEmail },
      });
    } else {
      await prisma.walletNotificationSetting.create({
        data: { minBalanceAvax, notificationEmail },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: '설정 저장에 실패했습니다.' },
      { status: 500 },
    );
  }
}
