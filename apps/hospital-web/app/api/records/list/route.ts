import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

/** 해당 patientId(바코드)의 진료 기록 목록 반환 (최신순) */
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    const hospitalId = user.hospitalId;
    if (!hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId')?.trim();
    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId가 필요합니다.' },
        { status: 400 },
      );
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId, hospitalId },
      orderBy: { createdAt: 'desc' },
      include: { stats: true },
    });

    const list = records.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      status: r.status,
      treatedAt: r.treatedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      stats: r.stats
        ? {
            procedureType: r.stats.procedureType,
            toothPosition: r.stats.toothPosition,
            procedureSite: r.stats.procedureSite,
          }
        : null,
    }));

    return NextResponse.json({ list });
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
