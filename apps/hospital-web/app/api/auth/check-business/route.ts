import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';

// 사업자등록번호 중복 확인 (TODO: 국세청 API는 추후 연동 예정)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessNumber = searchParams.get('businessNumber');

    if (!businessNumber || !businessNumber.trim()) {
      return NextResponse.json(
        { error: '사업자등록번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const existing = await prisma.hospital.findUnique({
      where: { businessNumber: businessNumber.trim() },
    });

    return NextResponse.json({
      exists: !!existing,
    });
  } catch (error) {
    console.error('Check business error:', error);
    return NextResponse.json(
      { error: '사업자번호 확인 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
