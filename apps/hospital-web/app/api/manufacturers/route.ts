import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';

export async function GET() {
  const list = await prisma.manufacturer.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return NextResponse.json(list);
}
