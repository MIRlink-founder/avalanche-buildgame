// 데이터베이스 시드 스크립트

import 'dotenv/config';
import { prisma } from '../src/client.ts';
import bcrypt from 'bcryptjs';

async function main() {
  // ── 기존 정산/결제 데이터 정리 (외래 키 순서대로) ──
  await prisma.payment.deleteMany({});
  await prisma.settlement.deleteMany({});

  // ── 1. SUPER_ADMIN 계정 ──
  const passwordHash = bcrypt.hashSync('admin123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@mire.com' },
    update: {},
    create: {
      email: 'admin@mire.com',
      passwordHash,
      name: '미르링크 어드민',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      hospitalId: null,
      departmentId: null,
    },
  });

  console.log('✅ SUPER_ADMIN 생성 완료:', superAdmin);

  // ── 2. 병원 5곳 생성 ──
  const hospitalSeeds = [
    {
      businessNumber: '123-45-67890',
      officialName: '서울미르치과의원',
      displayName: '미르치과',
      ceoName: '김서연',
      businessAddress: '서울특별시 강남구 테헤란로 123',
      managerName: '정민지',
      managerPhone: '010-1234-5678',
      managerEmail: 'hospital@mire.com',
      accountBank: '신한',
      accountNumber: '110-123-456789',
      accountHolder: '미르치과의원',
      paybackRate: 3.5,
      paybackRateUpdatedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    {
      businessNumber: '234-56-78901',
      officialName: '강남프라임치과의원',
      displayName: '강남프라임치과',
      ceoName: '이준호',
      businessAddress: '서울특별시 강남구 압구정로 45',
      managerName: '박지현',
      managerPhone: '010-2345-6789',
      managerEmail: 'prime@example.com',
      accountBank: '국민',
      accountNumber: '123-456-789012',
      accountHolder: '강남프라임치과의원',
      paybackRate: 4.5,
      paybackRateUpdatedAt: new Date('2026-01-20T09:00:00.000Z'),
    },
    {
      businessNumber: '345-67-89012',
      officialName: '연세좋은이치과의원',
      displayName: '연세좋은이치과',
      ceoName: '최영민',
      businessAddress: '서울특별시 서초구 서초대로 200',
      managerName: '김하늘',
      managerPhone: '010-3456-7890',
      managerEmail: 'yonsei@example.com',
      accountBank: '우리',
      accountNumber: '1002-543-234020',
      accountHolder: '연세좋은이치과의원',
      paybackRate: null as number | null,
      paybackRateUpdatedAt: null as Date | null,
    },
    {
      businessNumber: '456-78-90123',
      officialName: '분당서울치과의원',
      displayName: '분당서울치과',
      ceoName: '박민수',
      businessAddress: '경기도 성남시 분당구 정자일로 20',
      managerName: '이수진',
      managerPhone: '010-4567-8901',
      managerEmail: 'bundang@example.com',
      accountBank: '하나',
      accountNumber: '910-123-456789',
      accountHolder: '분당서울치과의원',
      paybackRate: null as number | null,
      paybackRateUpdatedAt: null as Date | null,
    },
    {
      businessNumber: '567-89-01234',
      officialName: '수원밝은치과의원',
      displayName: '수원밝은치과',
      ceoName: '정하윤',
      businessAddress: '경기도 수원시 영통구 광교로 50',
      managerName: '한소연',
      managerPhone: '010-5678-9012',
      managerEmail: 'suwon@example.com',
      accountBank: '농협',
      accountNumber: '302-1234-5678-01',
      accountHolder: '수원밝은치과의원',
      paybackRate: null as number | null,
      paybackRateUpdatedAt: null as Date | null,
    },
  ];

  const hospitals: { id: string; businessNumber: string }[] = [];

  for (const seed of hospitalSeeds) {
    const h = await prisma.hospital.upsert({
      where: { businessNumber: seed.businessNumber },
      update: {
        officialName: seed.officialName,
        displayName: seed.displayName,
        ceoName: seed.ceoName,
        businessAddress: seed.businessAddress,
        type: 'GENERAL',
        status: 'ACTIVE',
        managerName: seed.managerName,
        managerPhone: seed.managerPhone,
        managerEmail: seed.managerEmail,
        accountBank: seed.accountBank,
        accountNumber: seed.accountNumber,
        accountHolder: seed.accountHolder,
        paybackRate: seed.paybackRate,
        paybackRateUpdatedAt: seed.paybackRateUpdatedAt,
      },
      create: {
        businessNumber: seed.businessNumber,
        officialName: seed.officialName,
        displayName: seed.displayName,
        ceoName: seed.ceoName,
        businessAddress: seed.businessAddress,
        type: 'GENERAL',
        status: 'ACTIVE',
        managerName: seed.managerName,
        managerPhone: seed.managerPhone,
        managerEmail: seed.managerEmail,
        accountBank: seed.accountBank,
        accountNumber: seed.accountNumber,
        accountHolder: seed.accountHolder,
        paybackRate: seed.paybackRate,
        paybackRateUpdatedAt: seed.paybackRateUpdatedAt,
      },
    });
    hospitals.push({ id: h.id, businessNumber: seed.businessNumber });
  }

  // ── 3. 병원 사용자 계정 (미르치과용) ──
  const hospitalPasswordHash = bcrypt.hashSync('hospital123', 10);

  const hospitalUser = await prisma.user.upsert({
    where: { email: 'hospital@mire.com' },
    update: {
      hospitalId: hospitals[0].id,
      role: 'MASTER_ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: 'hospital@mire.com',
      passwordHash: hospitalPasswordHash,
      name: '미르치과 관리자',
      role: 'MASTER_ADMIN',
      status: 'ACTIVE',
      hospitalId: hospitals[0].id,
      departmentId: null,
    },
  });

  const doctorPasswordHash = bcrypt.hashSync('doctor123', 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@mire.com' },
    update: {
      hospitalId: hospitals[0].id,
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
      hospitalId: hospitals[0].id,
      departmentId: null,
    },
  });

  // 같은 병원의 추가 의사 계정 (테스트용)
  const doctor2PasswordHash = bcrypt.hashSync('doctor123', 10);
  const doctor2User = await prisma.user.upsert({
    where: { email: 'doctor2@mire.com' },
    update: {
      hospitalId: hospital.id,
      role: 'DEPT_ADMIN',
      status: 'ACTIVE',
      name: '미르치과 진료의사2',
    },
    create: {
      email: 'doctor2@mire.com',
      passwordHash: doctor2PasswordHash,
      name: '미르치과 진료의사2',
      role: 'DEPT_ADMIN',
      status: 'ACTIVE',
      hospitalId: hospital.id,
      departmentId: null,
    },
  });

  console.log('✅ DEPT_ADMIN 계정 생성 완료:', {
    doctor1: { email: doctorUser.email, password: 'doctor123' },
    doctor2: { email: doctor2User.email, password: 'doctor123' },
  });

  // ── 4. 정산 데이터 (2025-09 ~ 2026-01, 5개월 × 5개 병원) ──
  // 2026-02는 아직 진행 중이므로 정산 없음
  // 비율: 3.0~5.0% 현실적 범위
  interface SettlementSeed {
    publicId: string;
    hospitalIdx: number;
    start: string;
    end: string;
    totalVolume: string;
    caseCount: number;
    appliedRate: string;
    paybackAmount: string;
    status: string;
    settledAt: string | null;
  }

  const settlementSeeds: SettlementSeed[] = [
    // ── 2026-02 (이번 달, PENDING = 집계 중) ──
    { publicId: 'a1000000-0000-4000-8000-000000000001', hospitalIdx: 0, start: '2026-02-01T00:00:00.000Z', end: '2026-02-28T00:00:00.000Z', totalVolume: '4300000', caseCount: 18, appliedRate: '3.50', paybackAmount: '150500', status: 'PENDING', settledAt: null },
    { publicId: 'a1000000-0000-4000-8000-000000000002', hospitalIdx: 1, start: '2026-02-01T00:00:00.000Z', end: '2026-02-28T00:00:00.000Z', totalVolume: '6200000', caseCount: 25, appliedRate: '4.50', paybackAmount: '279000', status: 'PENDING', settledAt: null },

    // ── 2026-01 (전월, 기본 선택) ──
    { publicId: 'b1b6f8ab-2fd6-4d31-90d7-2d6e0cb8a95e', hospitalIdx: 0, start: '2026-01-01T00:00:00.000Z', end: '2026-01-31T00:00:00.000Z', totalVolume: '8200000', caseCount: 34, appliedRate: '3.50', paybackAmount: '287000', status: 'SETTLED', settledAt: '2026-02-05T10:00:00.000Z' },
    { publicId: 'a1000001-0001-4001-8001-000000000001', hospitalIdx: 1, start: '2026-01-01T00:00:00.000Z', end: '2026-01-31T00:00:00.000Z', totalVolume: '12500000', caseCount: 52, appliedRate: '4.50', paybackAmount: '562500', status: 'SETTLED', settledAt: '2026-02-05T10:00:00.000Z' },
    { publicId: 'a1000001-0001-4001-8001-000000000002', hospitalIdx: 2, start: '2026-01-01T00:00:00.000Z', end: '2026-01-31T00:00:00.000Z', totalVolume: '6800000', caseCount: 28, appliedRate: '5.00', paybackAmount: '340000', status: 'SETTLED', settledAt: '2026-02-05T10:00:00.000Z' },
    { publicId: 'a1000001-0001-4001-8001-000000000003', hospitalIdx: 3, start: '2026-01-01T00:00:00.000Z', end: '2026-01-31T00:00:00.000Z', totalVolume: '9100000', caseCount: 38, appliedRate: '5.00', paybackAmount: '455000', status: 'SETTLED', settledAt: '2026-02-05T10:00:00.000Z' },
    { publicId: 'a1000001-0001-4001-8001-000000000004', hospitalIdx: 4, start: '2026-01-01T00:00:00.000Z', end: '2026-01-31T00:00:00.000Z', totalVolume: '5400000', caseCount: 22, appliedRate: '5.00', paybackAmount: '270000', status: 'SETTLED', settledAt: '2026-02-05T10:00:00.000Z' },

    // ── 2025-12 ──
    { publicId: '2c8f66e9-7f0f-4f1a-9d7f-9d6b1b44586e', hospitalIdx: 0, start: '2025-12-01T00:00:00.000Z', end: '2025-12-31T00:00:00.000Z', totalVolume: '7500000', caseCount: 31, appliedRate: '3.50', paybackAmount: '262500', status: 'SETTLED', settledAt: '2026-01-05T10:00:00.000Z' },
    { publicId: 'a1000002-0001-4001-8001-000000000001', hospitalIdx: 1, start: '2025-12-01T00:00:00.000Z', end: '2025-12-31T00:00:00.000Z', totalVolume: '11200000', caseCount: 46, appliedRate: '4.50', paybackAmount: '504000', status: 'SETTLED', settledAt: '2026-01-05T10:00:00.000Z' },
    { publicId: 'a1000002-0001-4001-8001-000000000002', hospitalIdx: 2, start: '2025-12-01T00:00:00.000Z', end: '2025-12-31T00:00:00.000Z', totalVolume: '5900000', caseCount: 24, appliedRate: '5.00', paybackAmount: '295000', status: 'SETTLED', settledAt: '2026-01-05T10:00:00.000Z' },
    { publicId: 'a1000002-0001-4001-8001-000000000003', hospitalIdx: 3, start: '2025-12-01T00:00:00.000Z', end: '2025-12-31T00:00:00.000Z', totalVolume: '8600000', caseCount: 36, appliedRate: '5.00', paybackAmount: '430000', status: 'SETTLED', settledAt: '2026-01-05T10:00:00.000Z' },
    { publicId: 'a1000002-0001-4001-8001-000000000004', hospitalIdx: 4, start: '2025-12-01T00:00:00.000Z', end: '2025-12-31T00:00:00.000Z', totalVolume: '4800000', caseCount: 20, appliedRate: '5.00', paybackAmount: '240000', status: 'SETTLED', settledAt: '2026-01-05T10:00:00.000Z' },

    // ── 2025-11 ──
    { publicId: 'b2148d58-47fd-4f07-8d4f-16b07c3ab89c', hospitalIdx: 0, start: '2025-11-01T00:00:00.000Z', end: '2025-11-30T00:00:00.000Z', totalVolume: '6900000', caseCount: 29, appliedRate: '3.50', paybackAmount: '241500', status: 'SETTLED', settledAt: '2025-12-05T10:00:00.000Z' },
    { publicId: 'a1000003-0001-4001-8001-000000000001', hospitalIdx: 1, start: '2025-11-01T00:00:00.000Z', end: '2025-11-30T00:00:00.000Z', totalVolume: '10800000', caseCount: 45, appliedRate: '4.50', paybackAmount: '486000', status: 'SETTLED', settledAt: '2025-12-05T10:00:00.000Z' },
    { publicId: 'a1000003-0001-4001-8001-000000000002', hospitalIdx: 2, start: '2025-11-01T00:00:00.000Z', end: '2025-11-30T00:00:00.000Z', totalVolume: '6200000', caseCount: 26, appliedRate: '5.00', paybackAmount: '310000', status: 'SETTLED', settledAt: '2025-12-05T10:00:00.000Z' },
    { publicId: 'a1000003-0001-4001-8001-000000000003', hospitalIdx: 3, start: '2025-11-01T00:00:00.000Z', end: '2025-11-30T00:00:00.000Z', totalVolume: '7800000', caseCount: 32, appliedRate: '5.00', paybackAmount: '390000', status: 'SETTLED', settledAt: '2025-12-05T10:00:00.000Z' },

    // ── 2025-10 ──
    { publicId: '3f2db9b5-f87a-45f5-8a74-7c2f0b1ad1a4', hospitalIdx: 0, start: '2025-10-01T00:00:00.000Z', end: '2025-10-31T00:00:00.000Z', totalVolume: '7200000', caseCount: 30, appliedRate: '3.50', paybackAmount: '252000', status: 'SETTLED', settledAt: '2025-11-04T10:00:00.000Z' },
    { publicId: 'a1000004-0001-4001-8001-000000000001', hospitalIdx: 1, start: '2025-10-01T00:00:00.000Z', end: '2025-10-31T00:00:00.000Z', totalVolume: '9500000', caseCount: 40, appliedRate: '4.50', paybackAmount: '427500', status: 'SETTLED', settledAt: '2025-11-04T10:00:00.000Z' },
    { publicId: 'a1000004-0001-4001-8001-000000000002', hospitalIdx: 2, start: '2025-10-01T00:00:00.000Z', end: '2025-10-31T00:00:00.000Z', totalVolume: '5600000', caseCount: 23, appliedRate: '5.00', paybackAmount: '280000', status: 'SETTLED', settledAt: '2025-11-04T10:00:00.000Z' },

    // ── 2025-09 ──
    { publicId: '6f8c8b5b-1c3b-4bb6-9d64-41b2a3db8c73', hospitalIdx: 0, start: '2025-09-01T00:00:00.000Z', end: '2025-09-30T00:00:00.000Z', totalVolume: '6500000', caseCount: 27, appliedRate: '3.50', paybackAmount: '227500', status: 'SETTLED', settledAt: '2025-10-06T10:00:00.000Z' },
    { publicId: 'a1000005-0001-4001-8001-000000000001', hospitalIdx: 1, start: '2025-09-01T00:00:00.000Z', end: '2025-09-30T00:00:00.000Z', totalVolume: '8900000', caseCount: 37, appliedRate: '4.50', paybackAmount: '400500', status: 'SETTLED', settledAt: '2025-10-06T10:00:00.000Z' },
  ];

  const settlementMap = new Map<string, number>();
  for (const seed of settlementSeeds) {
    const hospitalId = hospitals[seed.hospitalIdx].id;
    const settlement = await prisma.settlement.upsert({
      where: { publicId: seed.publicId },
      update: {
        hospitalId,
        settlementPeriodStart: new Date(seed.start),
        settlementPeriodEnd: new Date(seed.end),
        totalVolume: seed.totalVolume,
        caseCount: seed.caseCount,
        appliedRate: seed.appliedRate,
        paybackAmount: seed.paybackAmount,
        isNftBoosted: false,
        status: seed.status,
        settledAt: seed.settledAt ? new Date(seed.settledAt) : null,
      },
      create: {
        publicId: seed.publicId,
        hospitalId,
        settlementPeriodStart: new Date(seed.start),
        settlementPeriodEnd: new Date(seed.end),
        totalVolume: seed.totalVolume,
        caseCount: seed.caseCount,
        appliedRate: seed.appliedRate,
        paybackAmount: seed.paybackAmount,
        isNftBoosted: false,
        status: seed.status,
        settledAt: seed.settledAt ? new Date(seed.settledAt) : null,
      },
    });
    settlementMap.set(seed.publicId, settlement.id);
  }

  // ── 5. 진료 기록 + 결제 (미르치과 전용, 최소한) ──
  const recordSeeds = [
    { patientId: 'PAT-0005', treatedAt: '2026-01-28T11:00:00.000Z' },
    { patientId: 'PAT-0006', treatedAt: '2026-01-15T16:00:00.000Z' },
  ];

  const recordMap = new Map<string, number>();
  for (const seed of recordSeeds) {
    const existing = await prisma.medicalRecord.findFirst({
      where: { patientId: seed.patientId, hospitalId: hospitals[0].id },
    });

    const record =
      existing ??
      (await prisma.medicalRecord.create({
        data: {
          patientId: seed.patientId,
          hospitalId: hospitals[0].id,
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
      patientId: 'PAT-0005',
      amount: '4500000',
      status: 'SETTLED',
      paymentMethod: 'CARD',
      approveNo: 'A-202601-0005',
      pgTransactionId: 'PG-202601-0005',
      paidAt: '2026-01-28T11:00:00.000Z',
      settlementPublicId: 'b1b6f8ab-2fd6-4d31-90d7-2d6e0cb8a95e',
    },
    {
      patientId: 'PAT-0006',
      amount: '3700000',
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
        hospitalId: hospitals[0].id,
        settlementId,
        subMid: 'SUBMID-TEST-001',
        approveNo: seed.approveNo ?? null,
        pgTransactionId: seed.pgTransactionId ?? null,
        amount: seed.amount,
        paymentMethod: seed.paymentMethod,
        status: seed.status,
        paidAt: seed.paidAt ? new Date(seed.paidAt) : null,
      },
      create: {
        medicalRecordId: recordId,
        hospitalId: hospitals[0].id,
        settlementId,
        subMid: 'SUBMID-TEST-001',
        approveNo: seed.approveNo ?? null,
        pgTransactionId: seed.pgTransactionId ?? null,
        amount: seed.amount,
        paymentMethod: seed.paymentMethod,
        status: seed.status,
        paidAt: seed.paidAt ? new Date(seed.paidAt) : null,
        createdAt: seed.paidAt ? new Date(seed.paidAt) : new Date(),
      },
    });
  }

  // ── 6. SystemConfig 초기값 ──
  const systemConfigSeeds = [
    { key: 'DEFAULT_PAYBACK_RATE', value: '5.00', description: '기본 페이백 비율 (%)' },
    { key: 'POS_FEE_RATE', value: '1.50', description: 'POS 수수료율 (%)' },
    { key: 'FIXED_PAYMENT_PER_CASE', value: '30000', description: '건당 고정 금액 (원)' },
  ];

  for (const config of systemConfigSeeds) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
  }

  console.log('✅ SystemConfig 초기값 생성 완료');

  console.log('✅ 병원 테스트 계정 생성 완료:', {
    hospitalId: hospitals[0].id,
    userId: hospitalUser.id,
    email: hospitalUser.email,
  });

  console.log(`✅ 정산 데이터 ${settlementSeeds.length}건 생성 완료 (5개 병원, 2025-09 ~ 2026-02)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
