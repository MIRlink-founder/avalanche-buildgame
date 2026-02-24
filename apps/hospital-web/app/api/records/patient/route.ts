import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

/** 해당 patientId(바코드)로 기존 진료 기록 존재 여부 및 기존 환자 정보 반환 */
export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const hospitalId = user.hospitalId;
    if (!hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const patientId =
      typeof body?.patientId === 'string' ? body.patientId.trim() : '';
    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId가 필요합니다.' },
        { status: 400 },
      );
    }

    const existing = await prisma.medicalRecord.findFirst({
      where: { patientId, hospitalId },
      orderBy: { createdAt: 'desc' },
      include: { stats: true },
    });

    if (!existing) {
      return NextResponse.json({ exists: false });
    }

    const stats = existing.stats;
    return NextResponse.json({
      exists: true,
      patientGender: stats?.patientGender ?? null,
      patientAgeGroup: stats?.patientAgeGroup ?? null,
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
