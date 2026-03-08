import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, requireAuth } from '@/lib/auth-guard';
import { decryptLayer2, decryptLayer3 } from '@/lib/records-encrypt-server';

export const runtime = 'nodejs';

/**
 * patientId 기준 최신 진료 기록 조회 (병원 무관 — 다른 병원에서 등록한 기록도 조회 가능).
 * - metaOnly: true → exists + patientGender, patientAgeGroup, treatedAt, createdAt (복호화 없음). 기록 없으면 200 { exists: false }.
 * - metaOnly 없음 → encryptedPayload(cipher1), treatedAt, createdAt. 기록 없으면 404.
 */
export async function POST(request: Request) {
  try {
    await requireAuth(request);

    const body = await request.json();
    const patientId =
      typeof body?.patientId === 'string' ? body.patientId.trim() : '';
    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId가 필요합니다.' },
        { status: 400 },
      );
    }

    const metaOnly = body?.metaOnly === true;

    const record = await prisma.medicalRecord.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { stats: true },
    });

    if (!record) {
      if (metaOnly) {
        return NextResponse.json({ exists: false });
      }
      return NextResponse.json(
        { error: '해당 환자의 진료 기록이 없습니다.' },
        { status: 404 },
      );
    }

    if (metaOnly) {
      const stats = record.stats;
      return NextResponse.json({
        exists: true,
        latestRecordStatus: record.status,
        patientGender: stats?.patientGender ?? null,
        patientAgeGroup: stats?.patientAgeGroup ?? null,
        treatedAt: record.treatedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
      });
    }

    const salt = process.env.MEDICAL_RECORD_ENCRYPTION_SALT;
    if (!salt) {
      return NextResponse.json(
        { error: '서버 암호화 설정이 없습니다.' },
        { status: 500 },
      );
    }

    const cipher2 = decryptLayer3(record.encryptedChartData, salt);
    const cipher1 = decryptLayer2(cipher2, patientId);

    return NextResponse.json({
      encryptedPayload: cipher1,
      treatedAt: record.treatedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
