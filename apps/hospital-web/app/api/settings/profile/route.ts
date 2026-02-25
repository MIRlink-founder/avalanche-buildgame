import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth, AuthError } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: user.hospitalId },
      select: { id: true, officialName: true, displayName: true },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const hospitalName = hospital.displayName ?? hospital.officialName;

    const userWithDept = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: { select: { name: true } },
      },
    });

    if (!userWithDept) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      user: {
        id: userWithDept.id,
        name: userWithDept.name,
        email: userWithDept.email,
        role: userWithDept.role,
        departmentName: userWithDept.department?.name ?? null,
      },
      hospital: {
        id: hospital.id,
        name: hospitalName,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error('내 계정 정보 조회 실패:', error);
    return NextResponse.json(
      { error: '내 계정 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
