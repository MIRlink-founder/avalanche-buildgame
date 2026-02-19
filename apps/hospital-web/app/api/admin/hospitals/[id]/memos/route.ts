import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError, isAdminRole } from '@/lib/auth-guard';

// 병원 메모 추가
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { id: hospitalId } = await context.params;
    if (!hospitalId) {
      return NextResponse.json(
        { error: '병원 ID가 필요합니다.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json(
        { error: '메모 내용을 입력해주세요.' },
        { status: 400 },
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true },
    });
    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    await prisma.hospitalMemo.create({
      data: {
        hospitalId,
        authorId: user.id,
        content,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('메모 저장 실패:', error);
    return NextResponse.json(
      { error: '메모 저장 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
