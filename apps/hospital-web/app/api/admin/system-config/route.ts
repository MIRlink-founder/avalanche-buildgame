import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, isAdminRole, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

// 시스템 설정 조회
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const configs = await prisma.systemConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const config of configs) {
      configMap[config.key] = config.value;
    }

    return NextResponse.json({ data: configMap });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('시스템 설정 조회 오류:', error);
    return NextResponse.json(
      { error: '시스템 설정 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}

// 시스템 설정 수정
export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      string
    >;

    const allowedKeys = new Set([
      'DEFAULT_PAYBACK_RATE',
      'POS_FEE_RATE',
      'FIXED_PAYMENT_PER_CASE',
    ]);

    const updates: { key: string; value: string }[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.has(key)) continue;
      if (typeof value !== 'string' || !value.trim()) continue;
      updates.push({ key, value: value.trim() });
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: '수정할 설정이 없습니다' },
        { status: 400 },
      );
    }

    for (const update of updates) {
      await prisma.systemConfig.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    const configs = await prisma.systemConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const config of configs) {
      configMap[config.key] = config.value;
    }

    return NextResponse.json({ data: configMap });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('시스템 설정 수정 오류:', error);
    return NextResponse.json(
      { error: '시스템 설정 수정 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
