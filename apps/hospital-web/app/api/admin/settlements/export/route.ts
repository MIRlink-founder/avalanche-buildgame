import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, isAdminRole, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 정산 내역 CSV 다운로드
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month')?.trim();

    const where: Record<string, unknown> = {};
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split('-');
      const year = Number(yearStr);
      const mon = Number(monthStr);
      const start = new Date(Date.UTC(year, mon - 1, 1));
      const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
      where.settlementPeriodStart = { gte: start };
      where.settlementPeriodEnd = { lte: end };
    }

    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        hospital: {
          select: {
            displayName: true,
            officialName: true,
            businessNumber: true,
            accountBank: true,
            accountNumber: true,
            accountHolder: true,
          },
        },
      },
    });

    const BOM = '\uFEFF';
    const header = '병원명,계좌번호,지급액,은행,예금주';
    const rows = settlements.map((s) => {
      const name =
        s.hospital?.displayName || s.hospital?.officialName || '';
      const account = s.hospital?.accountNumber || '';
      const payback = Number(s.paybackAmount).toLocaleString('ko-KR');
      const bank = s.hospital?.accountBank || '';
      const holder = s.hospital?.accountHolder || '';
      return `"${name}","${account}","${payback}","${bank}","${holder}"`;
    });

    const csv = BOM + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="settlements-${month || 'all'}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('정산 내역 다운로드 오류:', error);
    return NextResponse.json(
      { error: '정산 내역 다운로드 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
