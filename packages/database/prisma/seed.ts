// 데이터베이스 시드 스크립트

import 'dotenv/config';
import { prisma } from '../src/client.ts';
import bcrypt from 'bcryptjs';

async function main() {
  // SUPER_ADMIN 계정 생성
  const passwordHash = bcrypt.hashSync('admin123!', 10); // 비밀번호

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@mire.com' }, // 아이디
    update: {},
    create: {
      email: 'admin@mire.com',
      passwordHash,
      name: '미르링크 어드민',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      hospitalId: null, // 운영사는 병원 없음
      departmentId: null,
    },
  });

  console.log('✅ SUPER_ADMIN 생성 완료:', superAdmin);

  // 병원 테스트 계정 생성
  const hospital = await prisma.hospital.upsert({
    where: { businessNumber: '123-45-67890' },
    update: {
      officialName: '서울미르치과의원',
      displayName: '미르치과',
      ceoName: '김서연',
      businessAddress: '서울특별시 강남구 테헤란로 123',
      type: 'GENERAL',
      status: 'ACTIVE',
      managerName: '정민지',
      managerPhone: '010-1234-5678',
      managerEmail: 'hospital@mire.com',
      accountBank: '신한',
      accountNumber: '110-123-456789',
      accountHolder: '미르치과의원',
    },
    create: {
      businessNumber: '123-45-67890',
      officialName: '서울미르치과의원',
      displayName: '미르치과',
      ceoName: '김서연',
      businessAddress: '서울특별시 강남구 테헤란로 123',
      type: 'GENERAL',
      status: 'ACTIVE',
      managerName: '정민지',
      managerPhone: '010-1234-5678',
      managerEmail: 'hospital@mire.com',
      accountBank: '신한',
      accountNumber: '110-123-456789',
      accountHolder: '미르치과의원',
    },
  });

  const hospitalPasswordHash = bcrypt.hashSync('hospital123', 10);

  const hospitalUser = await prisma.user.upsert({
    where: { email: 'hospital@mire.com' },
    update: {
      hospitalId: hospital.id,
      role: 'MASTER_ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: 'hospital@mire.com',
      passwordHash: hospitalPasswordHash,
      name: '미르치과 관리자',
      role: 'MASTER_ADMIN',
      status: 'ACTIVE',
      hospitalId: hospital.id,
      departmentId: null,
    },
  });

  const doctorPasswordHash = bcrypt.hashSync('doctor123', 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@mire.com' },
    update: {
      hospitalId: hospital.id,
      role: 'DEPT_ADMIN',
      status: 'ACTIVE',
      name: '미르치과 진료의사',
    },
    create: {
      email: 'doctor@mire.com',
      passwordHash: doctorPasswordHash,
      name: '미르치과 진료의사',
      role: 'DEPT_ADMIN',
      status: 'ACTIVE',
      hospitalId: hospital.id,
      departmentId: null,
    },
  });

  const settlementSeeds = [
    {
      publicId: '3e1eb70d-9c7d-4b1b-b504-14fc35d76c4b',
      start: '2026-02-01T00:00:00.000Z',
      end: '2026-02-28T00:00:00.000Z',
      totalVolume: '14000000',
      appliedRate: '88.90',
      paybackAmount: '12446000',
      status: 'PENDING_PAYMENT',
      settledAt: null,
    },
    {
      publicId: 'b1b6f8ab-2fd6-4d31-90d7-2d6e0cb8a95e',
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T00:00:00.000Z',
      totalVolume: '8200000',
      appliedRate: '90.00',
      paybackAmount: '7380000',
      status: 'SETTLED',
      settledAt: '2026-02-05T10:00:00.000Z',
    },
    {
      publicId: '2c8f66e9-7f0f-4f1a-9d7f-9d6b1b44586e',
      start: '2025-12-01T00:00:00.000Z',
      end: '2025-12-31T00:00:00.000Z',
      totalVolume: '5200000',
      appliedRate: '87.00',
      paybackAmount: '4524000',
      status: 'SETTLED',
      settledAt: '2026-01-05T10:00:00.000Z',
    },
    {
      publicId: 'b2148d58-47fd-4f07-8d4f-16b07c3ab89c',
      start: '2025-11-01T00:00:00.000Z',
      end: '2025-11-30T00:00:00.000Z',
      totalVolume: '6000000',
      appliedRate: '88.00',
      paybackAmount: '5280000',
      status: 'SETTLED',
      settledAt: '2025-12-05T10:00:00.000Z',
    },
    {
      publicId: '3f2db9b5-f87a-45f5-8a74-7c2f0b1ad1a4',
      start: '2025-10-01T00:00:00.000Z',
      end: '2025-10-31T00:00:00.000Z',
      totalVolume: '4500000',
      appliedRate: '89.50',
      paybackAmount: '4027500',
      status: 'SETTLED',
      settledAt: '2025-11-04T10:00:00.000Z',
    },
    {
      publicId: '6f8c8b5b-1c3b-4bb6-9d64-41b2a3db8c73',
      start: '2025-09-01T00:00:00.000Z',
      end: '2025-09-30T00:00:00.000Z',
      totalVolume: '3900000',
      appliedRate: '88.00',
      paybackAmount: '3432000',
      status: 'PENDING_PAYMENT',
      settledAt: null,
    },
  ];

  const settlementMap = new Map<string, number>();
  for (const seed of settlementSeeds) {
    const settlement = await prisma.settlement.upsert({
      where: { publicId: seed.publicId },
      update: {
        hospitalId: hospital.id,
        settlementPeriodStart: new Date(seed.start),
        settlementPeriodEnd: new Date(seed.end),
        totalVolume: seed.totalVolume,
        appliedRate: seed.appliedRate,
        paybackAmount: seed.paybackAmount,
        isNftBoosted: false,
        status: seed.status,
        settledAt: seed.settledAt ? new Date(seed.settledAt) : null,
      },
      create: {
        publicId: seed.publicId,
        hospitalId: hospital.id,
        settlementPeriodStart: new Date(seed.start),
        settlementPeriodEnd: new Date(seed.end),
        totalVolume: seed.totalVolume,
        appliedRate: seed.appliedRate,
        paybackAmount: seed.paybackAmount,
        isNftBoosted: false,
        status: seed.status,
        settledAt: seed.settledAt ? new Date(seed.settledAt) : null,
      },
    });
    settlementMap.set(seed.publicId, settlement.id);
  }

  const recordSeeds = [
    { patientId: 'PAT-0001', treatedAt: '2026-02-28T12:00:00.000Z' },
    { patientId: 'PAT-0002', treatedAt: '2026-02-20T10:00:00.000Z' },
    { patientId: 'PAT-0003', treatedAt: '2026-02-18T09:00:00.000Z' },
    { patientId: 'PAT-0004', treatedAt: '2026-02-10T14:30:00.000Z' },
    { patientId: 'PAT-0005', treatedAt: '2026-01-28T11:00:00.000Z' },
    { patientId: 'PAT-0006', treatedAt: '2026-01-15T16:00:00.000Z' },
  ];

  const recordMap = new Map<string, number>();
  for (const seed of recordSeeds) {
    const existing = await prisma.medicalRecord.findFirst({
      where: {
        patientId: seed.patientId,
        hospitalId: hospital.id,
      },
    });

    const record =
      existing ??
      (await prisma.medicalRecord.create({
        data: {
          patientId: seed.patientId,
          hospitalId: hospital.id,
          doctorId: doctorUser.id,
          encryptedChartData: 'seed-chart-data',
          status: 'PAID',
          treatedAt: new Date(seed.treatedAt),
        },
      }));
    recordMap.set(seed.patientId, record.id);
  }

  const paymentSeeds = [
    {
      patientId: 'PAT-0001',
      amount: '14000000',
      status: 'PAID',
      paymentMethod: 'CARD',
      approveNo: 'A-202602-0001',
      pgTransactionId: 'PG-202602-0001',
      paidAt: '2026-02-28T12:00:00.000Z',
      settlementPublicId: '3e1eb70d-9c7d-4b1b-b504-14fc35d76c4b',
    },
    {
      patientId: 'PAT-0002',
      amount: '8200000',
      status: 'READY',
      paymentMethod: 'TRANSFER',
      approveNo: null,
      pgTransactionId: 'PG-202602-0002',
      paidAt: null,
      settlementPublicId: null,
    },
    {
      patientId: 'PAT-0003',
      amount: '5200000',
      status: 'PENDING',
      paymentMethod: 'CARD',
      approveNo: null,
      pgTransactionId: 'PG-202602-0003',
      paidAt: null,
      settlementPublicId: null,
    },
    {
      patientId: 'PAT-0004',
      amount: '6300000',
      status: 'CANCELLED',
      paymentMethod: 'CARD',
      approveNo: null,
      pgTransactionId: 'PG-202602-0004',
      paidAt: null,
      cancelledAt: '2026-02-12T10:00:00.000Z',
      settlementPublicId: null,
    },
    {
      patientId: 'PAT-0005',
      amount: '4500000',
      status: 'FAILED',
      paymentMethod: 'CARD',
      approveNo: null,
      pgTransactionId: 'PG-202601-0005',
      paidAt: null,
      settlementPublicId: null,
    },
    {
      patientId: 'PAT-0006',
      amount: '9600000',
      status: 'SETTLED',
      paymentMethod: 'CARD',
      approveNo: 'A-202601-0006',
      pgTransactionId: 'PG-202601-0006',
      paidAt: '2026-01-15T16:00:00.000Z',
      settlementPublicId: 'b1b6f8ab-2fd6-4d31-90d7-2d6e0cb8a95e',
    },
  ];

  for (const seed of paymentSeeds) {
    const recordId = recordMap.get(seed.patientId);
    if (!recordId) continue;
    const settlementId = seed.settlementPublicId
      ? (settlementMap.get(seed.settlementPublicId) ?? null)
      : null;

    await prisma.payment.upsert({
      where: { medicalRecordId: recordId },
      update: {
        hospitalId: hospital.id,
        settlementId,
        subMid: 'SUBMID-TEST-001',
        approveNo: seed.approveNo ?? null,
        pgTransactionId: seed.pgTransactionId ?? null,
        amount: seed.amount,
        paymentMethod: seed.paymentMethod,
        status: seed.status,
        paidAt: seed.paidAt ? new Date(seed.paidAt) : null,
        cancelledAt: seed.cancelledAt ? new Date(seed.cancelledAt) : null,
      },
      create: {
        medicalRecordId: recordId,
        hospitalId: hospital.id,
        settlementId,
        subMid: 'SUBMID-TEST-001',
        approveNo: seed.approveNo ?? null,
        pgTransactionId: seed.pgTransactionId ?? null,
        amount: seed.amount,
        paymentMethod: seed.paymentMethod,
        status: seed.status,
        paidAt: seed.paidAt ? new Date(seed.paidAt) : null,
        cancelledAt: seed.cancelledAt ? new Date(seed.cancelledAt) : null,
        createdAt: seed.paidAt ? new Date(seed.paidAt) : new Date(),
      },
    });
  }

  console.log('✅ 병원 테스트 계정 생성 완료:', {
    hospitalId: hospital.id,
    userId: hospitalUser.id,
    email: hospitalUser.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
