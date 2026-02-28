import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@mire/database';

/**
 * 6자리 PIN 검증. patientId(userCardKey)에 대한 DB 해시와 비교.
 */
export async function POST(request: Request) {
  let body: { patientId?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '요청 형식이 올바르지 않습니다.' },
      { status: 400 }
    );
  }

  const patientId =
    typeof body?.patientId === 'string' ? body.patientId.trim() : '';
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';

  if (!patientId) {
    return NextResponse.json(
      { error: 'patientId가 필요합니다.' },
      { status: 400 }
    );
  }
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: '6자리 숫자 비밀번호를 입력해주세요.' },
      { status: 400 }
    );
  }

  try {
    const row = await prisma.patientPin.findFirst({
      where: { userCardKey: patientId },
    });
    if (!row?.pinNumber) {
      return NextResponse.json(
        { error: '등록된 비밀번호가 없습니다.' },
        { status: 404 }
      );
    }
    const match = bcrypt.compareSync(pin, row.pinNumber);
    if (!match) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
