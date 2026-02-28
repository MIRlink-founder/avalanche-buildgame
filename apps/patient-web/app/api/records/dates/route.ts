import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';

/**
 * 환자 진료 기록 일자 목록 (메타만). patientId로 조회.
 */
export async function POST(request: Request) {
  let body: { patientId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }
  const patientId =
    typeof body?.patientId === 'string' ? body.patientId.trim() : '';
  if (!patientId) {
    return NextResponse.json(
      { error: 'patientId가 필요합니다.' },
      { status: 400 },
    );
  }

  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, treatedAt: true, createdAt: true },
    });
    const dates = records.map((r) => ({
      id: r.id,
      treatedAt: r.treatedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json({ dates });
  } catch {
    return NextResponse.json(
      { error: '진료 일자 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
