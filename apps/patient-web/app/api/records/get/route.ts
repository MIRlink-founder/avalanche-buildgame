import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { decryptLayer2, decryptLayer3 } from '@/lib/records-encrypt-server';

/**
 * 단일 진료 기록 조회. patientId + recordId로 cipher1(encryptedPayload) 반환.
 * 복호화 방법은 hospital-web /api/records/latest와 동일.
 */
export async function POST(request: Request) {
  let body: { patientId?: string; recordId?: number };
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
  const recordId =
    typeof body?.recordId === 'number' && Number.isInteger(body.recordId)
      ? body.recordId
      : null;
  if (!patientId || recordId == null) {
    return NextResponse.json(
      { error: 'patientId와 recordId가 필요합니다.' },
      { status: 400 },
    );
  }

  const salt = process.env.MEDICAL_RECORD_ENCRYPTION_SALT;
  if (!salt) {
    return NextResponse.json(
      { error: '서버 암호화 설정이 없습니다.' },
      { status: 500 },
    );
  }

  try {
    const record = await prisma.medicalRecord.findFirst({
      where: { patientId, id: recordId },
    });
    if (!record) {
      return NextResponse.json(
        { error: '해당 진료 기록이 없습니다.' },
        { status: 404 },
      );
    }
    const cipher2 = decryptLayer3(record.encryptedChartData, salt);
    const cipher1 = decryptLayer2(cipher2, patientId);
    return NextResponse.json({
      encryptedPayload: cipher1,
      treatedAt: record.treatedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: '진료 기록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
