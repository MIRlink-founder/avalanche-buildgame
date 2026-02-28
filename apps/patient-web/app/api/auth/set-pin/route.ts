import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@mire/database';

/**
 * 6자리 PIN 설정 완료 시 호출. patientId(userCardKey)에 대해 해시된 PIN 저장.
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
    const hashed = bcrypt.hashSync(pin, 10);
    const existing = await prisma.patientPin.findFirst({
      where: { userCardKey: patientId },
    });
    if (existing) {
      await prisma.patientPin.update({
        where: { id: existing.id },
        data: { pinNumber: hashed },
      });
    } else {
      await prisma.patientPin.create({
        data: { userCardKey: patientId, pinNumber: hashed },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
