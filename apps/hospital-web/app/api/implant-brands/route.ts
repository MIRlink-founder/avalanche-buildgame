import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';

export async function GET(request: NextRequest) {
  const manufacturerId = request.nextUrl.searchParams.get('manufacturerId');
  if (!manufacturerId) {
    return NextResponse.json(
      { error: 'manufacturerId 쿼리 필수' },
      { status: 400 },
    );
  }
  const id = parseInt(manufacturerId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: '유효하지 않은 manufacturerId' }, { status: 400 });
  }
  const list = await prisma.implantBrand.findMany({
    where: { manufacturerId: id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return NextResponse.json(list);
}

/** 브랜드(제품명) 생성 — 있으면 기존 반환 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { manufacturerId, name } = body as { manufacturerId?: number; name?: string };
  if (manufacturerId == null || !name?.trim()) {
    return NextResponse.json(
      { error: 'manufacturerId, name 필수' },
      { status: 400 },
    );
  }
  const brand = await prisma.implantBrand.upsert({
    where: {
      manufacturerId_name: {
        manufacturerId,
        name: name.trim(),
      },
    },
    create: { manufacturerId, name: name.trim() },
    update: {},
    select: { id: true, name: true },
  });
  return NextResponse.json(brand);
}
