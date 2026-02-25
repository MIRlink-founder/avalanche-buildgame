import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

const REPORTS_GATE_MIN_COUNT = 50;

/**
 * 데이터 리포트 게이트용 통계 조회
 * MASTER_ADMIN의 병원 유형 + PAID/ON-CHAINED 진료 기록 수 반환
 */
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

    // 비-MASTER_ADMIN은 통계 없이 응답 (접근 거부 메시지는 FeatureGate에서 처리)
    if (user.role !== 'MASTER_ADMIN') {
      return NextResponse.json({
        hospitalType: null,
        paidOrOnChainedRecordCount: 0,
        requiredCount: REPORTS_GATE_MIN_COUNT,
      });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { type: true },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const paidOrOnChainedRecordCount = await prisma.medicalRecord.count({
      where: {
        hospitalId,
        status: { in: ['PAID', 'ON-CHAINED'] },
      },
    });

    return NextResponse.json({
      hospitalType: hospital.type,
      paidOrOnChainedRecordCount,
      requiredCount: REPORTS_GATE_MIN_COUNT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('리포트 게이트 통계 조회 실패:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
