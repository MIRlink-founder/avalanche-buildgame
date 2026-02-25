import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: '유효하지 않은 id' }, { status: 400 });
  }
  const body = await request.json();
  const { size, status } = body as { size?: string; status?: string };
  const data: { size?: string; status?: string } = {};
  if (size !== undefined) data.size = String(size).trim();
  if (status === 'ACTIVE' || status === 'INACTIVE') data.status = status;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '수정할 필드 없음' }, { status: 400 });
  }
  const item = await prisma.implantItem.update({
    where: { id },
    data,
    include: {
      brand: { include: { manufacturer: true } },
    },
  });
  return NextResponse.json({
    id: item.id,
    manufacturerName: item.brand.manufacturer.name,
    brandName: item.brand.name,
    size: item.size,
    status: item.status,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: '유효하지 않은 id' }, { status: 400 });
  }
  await prisma.implantItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
