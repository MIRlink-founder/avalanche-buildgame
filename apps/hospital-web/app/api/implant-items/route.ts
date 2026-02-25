import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mire/database';

/** ACTIVE ImplantItem 목록 (제조사·브랜드·사이즈). ?manufacturerId= 있으면 해당 제조사만. ?includeInactive=1 이면 INACTIVE 포함 */
export async function GET(request: NextRequest) {
  const manufacturerIdParam = request.nextUrl.searchParams.get('manufacturerId');
  const includeInactive = request.nextUrl.searchParams.get('includeInactive') === '1';
  const where: { status?: string; brand?: { manufacturerId: number } } = {};
  if (!includeInactive) where.status = 'ACTIVE';
  if (manufacturerIdParam) {
    const mid = parseInt(manufacturerIdParam, 10);
    if (!Number.isNaN(mid)) where.brand = { manufacturerId: mid };
  }
  const items = await prisma.implantItem.findMany({
    where,
    include: {
      brand: {
        include: { manufacturer: true },
      },
    },
  });
  const list = items
    .map((item) => ({
      id: item.id,
      brandId: item.brandId,
      manufacturerName: item.brand.manufacturer.name,
      manufacturerId: item.brand.manufacturer.id,
      brandName: item.brand.name,
      size: item.size,
      status: item.status,
    }))
    .sort((a, b) => {
      if (a.manufacturerName !== b.manufacturerName)
        return a.manufacturerName.localeCompare(b.manufacturerName);
      if (a.brandName !== b.brandName)
        return a.brandName.localeCompare(b.brandName);
      return String(a.size).localeCompare(String(b.size));
    });
  return NextResponse.json(list);
}

/** 픽스처 추가 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brandId, size, status } = body as {
    brandId?: number;
    size?: string;
    status?: string;
  };
  if (brandId == null || !size?.trim()) {
    return NextResponse.json(
      { error: 'brandId, size 필수' },
      { status: 400 },
    );
  }
  const item = await prisma.implantItem.create({
    data: {
      brandId,
      size: size.trim(),
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    },
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
