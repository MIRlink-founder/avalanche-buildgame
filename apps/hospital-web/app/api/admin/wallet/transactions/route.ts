import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';
import { avalanche } from '@mire/blockchain/wagmi/chains';

const PAGE_SIZE = 10;

/** 트랜잭션 소모 이력 목록 (페이지네이션) */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || PAGE_SIZE));
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      prisma.blockchainTransaction.findMany({
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: {
          medicalRecord: {
            include: {
              hospital: {
                select: {
                  displayName: true,
                  officialName: true,
                },
              },
            },
          },
        },
      }),
      prisma.blockchainTransaction.count(),
    ]);

    const explorerUrl = avalanche.blockExplorers?.default?.url ?? 'https://snowtrace.io';

    const data = items.map((tx) => {
      const hospital = tx.medicalRecord?.hospital;
      const hospitalName =
        hospital?.displayName ?? hospital?.officialName ?? '-';
      const txHashShort =
        tx.txHash.length > 10
          ? tx.txHash.slice(0, 6) + '...' + tx.txHash.slice(-4)
          : tx.txHash;
      const success = tx.status === 'CONFIRMED';
      return {
        id: tx.id,
        uploadedAt: tx.uploadedAt.toISOString(),
        hospitalName,
        kind: '데이터 업로드',
        txHash: tx.txHash,
        txHashShort,
        explorerUrl: `${explorerUrl}/tx/${tx.txHash}`,
        gasUsed: '-', // 스키마에 가스비 필드 없음, 추후 확장 시 채움
        status: success ? '성공' : '실패',
        statusValue: tx.status,
      };
    });

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      data,
      totalCount,
      totalPages,
      page,
      pageSize: limit,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: '트랜잭션 이력을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
