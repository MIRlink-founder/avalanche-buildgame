import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, requireAuth, resolveHospitalId } from '@/lib/auth-guard';

export const runtime = 'nodejs';

function getRequestedHospitalId(request: Request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get('hospitalId');
}

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const hospitalId = resolveHospitalId(user, getRequestedHospitalId(request));

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        accountBank: true,
        accountNumber: true,
        accountHolder: true,
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: hospital });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('정산 계좌 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 계좌 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const hospitalId = resolveHospitalId(user, getRequestedHospitalId(request));

    const body = (await request.json().catch(() => ({}))) as Partial<{
      accountBank: string;
      accountNumber: string;
      accountHolder: string;
    }>;

    const accountBank = body.accountBank?.trim();
    const accountNumber = body.accountNumber?.trim();
    const accountHolder = body.accountHolder?.trim();

    if (!accountBank || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: '정산 계좌 정보를 모두 입력해주세요' },
        { status: 400 },
      );
    }

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        accountBank,
        accountNumber,
        accountHolder,
      },
      select: {
        accountBank: true,
        accountNumber: true,
        accountHolder: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('정산 계좌 저장 오류:', error);
    return NextResponse.json(
      { error: '정산 계좌 저장 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
