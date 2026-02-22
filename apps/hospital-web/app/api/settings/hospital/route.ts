import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { requireAuth } from '@/lib/auth-guard';

/** 로그인한 병원 소속 사용자의 병원 정보 조회 */
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: '마스터 관리자만 접근할 수 있습니다.' },
        { status: 403 },
      );
    }
    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: user.hospitalId },
      select: {
        id: true,
        officialName: true,
        displayName: true,
        businessNumber: true,
        ceoName: true,
        accountBank: true,
        accountNumber: true,
        accountHolder: true,
        managerPhone: true,
        managerEmail: true,
        businessAddress: true,
        addressZipcode: true,
        addressRoad: true,
        addressDetail: true,
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { error: '병원을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json(hospital);
  } catch (error: unknown) {
    const message =
      error && typeof (error as { message?: string }).message === 'string'
        ? (error as { message: string }).message
        : '인증이 필요합니다.';
    const status =
      error && typeof (error as { status?: number }).status === 'number'
        ? (error as { status: number }).status
        : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

/** 병원 설정(입금 계좌, 연락처, 주소) 수정 — 병원 식별 정보는 수정 불가 */
export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuth(request);
    if (user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: '마스터 관리자만 수정할 수 있습니다.' },
        { status: 403 },
      );
    }
    if (!user.hospitalId) {
      return NextResponse.json(
        { error: '병원 정보가 없습니다.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      accountBank,
      accountNumber,
      accountHolder,
      managerPhone,
      managerEmail,
      addressZipcode,
      addressRoad,
      addressDetail,
    } = body as {
      accountBank?: string;
      accountNumber?: string;
      accountHolder?: string;
      managerPhone?: string;
      managerEmail?: string;
      addressZipcode?: string;
      addressRoad?: string;
      addressDetail?: string;
    };

    // 필수값: 주소(우편번호 + 기본주소 + 상세주소)
    const zip = addressZipcode?.trim() ?? '';
    const road = addressRoad?.trim() ?? '';
    const detail = addressDetail?.trim() ?? '';
    if (!zip || !road || !detail) {
      return NextResponse.json(
        { error: '누락 값이 존재합니다.', code: 'VALIDATION' },
        { status: 400 },
      );
    }

    const hospital = await prisma.hospital.update({
      where: { id: user.hospitalId },
      data: {
        ...(accountBank !== undefined && {
          accountBank: accountBank?.trim() || null,
        }),
        ...(accountNumber !== undefined && {
          accountNumber: accountNumber?.replace(/-/g, '').trim() || null,
        }),
        ...(accountHolder !== undefined && {
          accountHolder: accountHolder?.trim() || null,
        }),
        ...(managerPhone !== undefined && {
          managerPhone: managerPhone?.trim() || null,
        }),
        ...(managerEmail !== undefined && {
          managerEmail: managerEmail?.trim() || null,
        }),
        addressZipcode: zip || null,
        addressRoad: road || null,
        addressDetail: detail || null,
        businessAddress: [zip, road, detail].filter(Boolean).join(' '),
      },
    });

    return NextResponse.json(hospital);
  } catch (error: unknown) {
    const message =
      error && typeof (error as { message?: string }).message === 'string'
        ? (error as { message: string }).message
        : '인증이 필요합니다.';
    const status =
      error && typeof (error as { status?: number }).status === 'number'
        ? (error as { status: number }).status
        : 401;
    return NextResponse.json(
      { error: message },
      { status: status >= 400 ? status : 500 },
    );
  }
}
