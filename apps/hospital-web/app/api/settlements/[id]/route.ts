import { NextResponse } from 'next/server';
import { prisma } from '@mire/database';
import { AuthError, assertHospitalAccess, requireAuth } from '@/lib/auth-guard';

export const runtime = 'nodejs';

function getPositiveInt(value: string) {
  if (!/^[0-9]+$/.test(value.trim())) {
    return null;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  return parsed > 0 ? parsed : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const settlementId = getPositiveInt(id);
    const isPublicId = isUuid(id);

    if (!settlementId && !isPublicId) {
      return NextResponse.json(
        { error: '정산 ID 형식이 올바르지 않습니다' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const includePayments = searchParams.get('includePayments') === 'true';
    const includeTransfers = searchParams.get('includeTransfers') === 'true';

    const include: Record<string, unknown> = {};

    if (includePayments) {
      include.payments = {
        select: {
          id: true,
          medicalRecordId: true,
          hospitalId: true,
          settlementId: true,
          subMid: true,
          approveNo: true,
          pgTransactionId: true,
          amount: true,
          paymentMethod: true,
          status: true,
          paidAt: true,
          cancelledAt: true,
          createdAt: true,
        },
      };
    }

    if (includeTransfers) {
      include.bankTransfers = {
        select: {
          id: true,
          settlementId: true,
          amount: true,
          accountNumber: true,
          bankName: true,
          transferStatus: true,
          transferResult: true,
          transferredAt: true,
          createdAt: true,
        },
      };
    }

    const settlement = await prisma.settlement.findUnique({
      where: settlementId ? { id: settlementId } : { publicId: id },
      include: {
        ...include,
        hospital: {
          select: {
            id: true,
            displayName: true,
            officialName: true,
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: '정산 정보를 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    assertHospitalAccess(user, settlement.hospitalId);

    return NextResponse.json({ data: settlement });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('정산 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 상세 조회 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth(request);
    const { id } = await context.params;
    const settlementId = getPositiveInt(id);
    const isPublicId = isUuid(id);

    if (!settlementId && !isPublicId) {
      return NextResponse.json(
        { error: '정산 ID 형식이 올바르지 않습니다' },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      status: string;
      appliedRate: string | number;
      paybackAmount: string | number;
      settledAt: string;
    }>;

    const settlement = await prisma.settlement.findUnique({
      where: settlementId ? { id: settlementId } : { publicId: id },
      select: { id: true, hospitalId: true },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: '정산 정보를 찾을 수 없습니다' },
        { status: 404 },
      );
    }

    assertHospitalAccess(user, settlement.hospitalId);

    const data: Record<string, unknown> = {};
    const status = body.status?.trim();
    const hasRate = body.appliedRate !== undefined;
    const hasPayback = body.paybackAmount !== undefined;

    if (status) {
      if (!['PENDING_PAYMENT', 'SETTLED'].includes(status)) {
        return NextResponse.json(
          { error: '정산 상태 값이 올바르지 않습니다' },
          { status: 400 },
        );
      }
      data.status = status;
      if (status === 'SETTLED') {
        if (!body.settledAt) {
          return NextResponse.json(
            { error: '정산일을 입력해주세요' },
            { status: 400 },
          );
        }
        const settledAtDate = new Date(body.settledAt);
        if (Number.isNaN(settledAtDate.getTime())) {
          return NextResponse.json(
            { error: '정산일 형식이 올바르지 않습니다' },
            { status: 400 },
          );
        }
        data.settledAt = settledAtDate;
      } else {
        data.settledAt = null;
      }
    }

    if (hasRate || hasPayback) {
      if (!hasRate || !hasPayback) {
        return NextResponse.json(
          { error: '정산율과 페이백 금액이 모두 필요합니다' },
          { status: 400 },
        );
      }
      const rateValue = Number(body.appliedRate);
      const paybackValue = Number(body.paybackAmount);
      if (!Number.isFinite(rateValue) || rateValue < 0 || rateValue > 100) {
        return NextResponse.json(
          { error: '정산율은 0에서 100 사이 숫자여야 합니다' },
          { status: 400 },
        );
      }
      if (!Number.isFinite(paybackValue) || paybackValue < 0) {
        return NextResponse.json(
          { error: '페이백 금액은 0 이상이어야 합니다' },
          { status: 400 },
        );
      }
      data.appliedRate = rateValue.toFixed(2);
      data.paybackAmount = paybackValue.toFixed(2);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: '수정할 항목이 없습니다' },
        { status: 400 },
      );
    }

    const updated = await prisma.settlement.update({
      where: { id: settlement.id },
      data,
      select: {
        id: true,
        publicId: true,
        status: true,
        settledAt: true,
        appliedRate: true,
        paybackAmount: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error('정산 정보 수정 오류:', error);
    return NextResponse.json(
      { error: '정산 정보 수정 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
