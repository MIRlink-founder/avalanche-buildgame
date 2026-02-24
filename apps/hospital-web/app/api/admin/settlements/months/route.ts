import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, isAdminRole, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 정산 가능 월 목록 (Settlement의 settlementPeriodStart 기준 고유 월)
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const settlements = await prisma.settlement.findMany({
      select: { settlementPeriodStart: true },
      orderBy: { settlementPeriodStart: 'desc' },
    });

    const monthSet = new Set<string>();
    for (const s of settlements) {
      const date = new Date(s.settlementPeriodStart);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      monthSet.add(`${yyyy}-${mm}`);
    }

    return NextResponse.json({ data: Array.from(monthSet) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('정산 월 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 월 목록 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
