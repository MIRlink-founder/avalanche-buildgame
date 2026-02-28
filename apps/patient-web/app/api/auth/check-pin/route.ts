import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';

/**
 * patientId(userCardKey)에 대한 PatientPin 등록 여부 확인.
 * QR URL: ?patientId=abcd#1234 → abcd=patientId, 1234=pinCode(해시에 담아 전달, 복호화 시 사용)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId =
    typeof searchParams.get('patientId') === 'string'
      ? searchParams.get('patientId')!.trim()
      : '';

  if (!patientId) {
    return NextResponse.json(
      { error: 'patientId가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    const pin = await prisma.patientPin.findFirst({
      where: { userCardKey: patientId },
    });
    const hasPin = !!pin?.pinNumber;
    return NextResponse.json({ hasPin });
  } catch {
    return NextResponse.json(
      { error: '확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
