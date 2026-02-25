import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, isAdminRole, requireAuth } from '@/lib/auth-guard';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

// 정산 내역 XLSX 다운로드
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

    // ── xlsx 생성 ──
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('정산내역');

    // 열 너비 설정
    ws.columns = [
      { header: '병원명', key: 'name', width: 24 },
      { header: '계좌번호', key: 'account', width: 24 },
      { header: '지급액', key: 'payback', width: 18 },
      { header: '은행', key: 'bank', width: 12 },
      { header: '예금주', key: 'holder', width: 24 },
    ];

    // 헤더 스타일
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 데이터 행
    for (const s of settlements) {
      ws.addRow({
        name: s.hospital?.displayName || s.hospital?.officialName || '',
        account: s.hospital?.accountNumber || '',
        payback: Number(s.paybackAmount),
        bank: s.hospital?.accountBank || '',
        holder: s.hospital?.accountHolder || '',
      });
    }

    // 지급액 열 숫자 포맷
    ws.getColumn('payback').numFmt = '#,##0';

    const buffer = await wb.xlsx.writeBuffer();
    const filename = `settlements-${month || 'all'}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
