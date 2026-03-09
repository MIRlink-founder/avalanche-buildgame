// 데이터베이스 시드 스크립트

import 'dotenv/config';
import { prisma } from '../src/client.ts';
import bcrypt from 'bcryptjs';

async function main() {
  // ── SUPER_ADMIN 계정 ──
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

  // ── 병원 5곳 생성 ──
  const hospitalSeeds = [
    {
      businessNumber: '123-45-67890',
      officialName: '서울미르치과의원',
      ceoName: '김서연',
      businessAddress: '서울특별시 강남구 테헤란로 123',
      managerName: '정민지',
      managerPhone: '010-1234-5678',
      managerEmail: 'mire@example.com',
      type: 'UNIVERSITY',
      status: 'ACTIVE',
    },
    {
      businessNumber: '234-56-78901',
      officialName: '강남프라임치과의원',
      ceoName: '이준호',
      businessAddress: '서울특별시 강남구 압구정로 45',
      managerName: '박지현',
      managerPhone: '010-2345-6789',
      managerEmail: 'prime@example.com',
      type: 'GENERAL',
      status: 'ACTIVE',
    },
    {
      businessNumber: '345-67-89012',
      officialName: '연세좋은이치과의원',
      ceoName: '최영민',
      businessAddress: '서울특별시 서초구 서초대로 200',
      managerName: '김하늘',
      managerPhone: '010-3456-7890',
      managerEmail: 'yonsei@example.com',
      type: 'GENERAL',
      status: 'REJECTED',
    },
    {
      businessNumber: '456-78-90123',
      officialName: '분당서울치과의원',
      ceoName: '박민수',
      businessAddress: '경기도 성남시 분당구 정자일로 20',
      managerName: '이수진',
      managerPhone: '010-4567-8901',
      managerEmail: 'bundang@example.com',
      type: 'GENERAL',
      status: 'DISABLED',
    },
    {
      businessNumber: '567-89-01234',
      officialName: '수원밝은치과의원',
      ceoName: '정하윤',
      businessAddress: '경기도 수원시 영통구 광교로 50',
      managerName: '한소연',
      managerPhone: '010-5678-9012',
      managerEmail: 'suwon@example.com',
      type: 'GENERAL',
      status: 'WITHDRAWN',
    },
  ];

  const hospitals: { id: string; businessNumber: string }[] = [];

  for (const seed of hospitalSeeds) {
    const h = await prisma.hospital.upsert({
      where: { businessNumber: seed.businessNumber },
      update: {
        officialName: seed.officialName,
        ceoName: seed.ceoName,
        businessAddress: seed.businessAddress,
        managerName: seed.managerName,
        managerPhone: seed.managerPhone,
        managerEmail: seed.managerEmail,
        type: seed.type,
        status: seed.status,
      },
      create: {
        businessNumber: seed.businessNumber,
        officialName: seed.officialName,
        ceoName: seed.ceoName,
        businessAddress: seed.businessAddress,
        managerName: seed.managerName,
        managerPhone: seed.managerPhone,
        managerEmail: seed.managerEmail,
        type: seed.type,
        status: seed.status,
      },
    });
    hospitals.push({ id: h.id, businessNumber: seed.businessNumber });

    // -- 해당 병원의 MASTER_ADMIN 계정 1개 생성 --
    const masterAdmin = await prisma.user.upsert({
      where: { email: seed.managerEmail },
      update: {
        name: seed.managerName,
        role: 'MASTER_ADMIN',
        status: 'ACTIVE',
        hospitalId: h.id,
        departmentId: null,
      },
      create: {
        email: seed.managerEmail,
        passwordHash,
        name: seed.managerName,
        role: 'MASTER_ADMIN',
        status: 'ACTIVE',
        hospitalId: h.id,
        departmentId: null,
      },
    });
    console.log(
      `✅ MASTER_ADMIN 생성 완료 (${seed.officialName}):`,
      masterAdmin.email,
    );
  }

  // ── 정산 관련 더미값 ──
  const mireHospitalId = hospitals[0]!.id;

  // 2026년 1월·2월 지급 완료, 3월 지급 예정 (이번 달)
  const settlementSeeds = [
    {
      hospitalId: mireHospitalId,
      settlementPeriodStart: new Date(Date.UTC(2026, 0, 1)),
      settlementPeriodEnd: new Date(Date.UTC(2026, 0, 31)),
      totalVolume: 4_158_000,
      caseCount: 42,
      appliedRate: 5,
      paybackAmount: 207_900,
      status: 'SETTLED',
      settledAt: new Date(Date.UTC(2026, 1, 25)),
    },
    {
      hospitalId: mireHospitalId,
      settlementPeriodStart: new Date(Date.UTC(2026, 1, 1)),
      settlementPeriodEnd: new Date(Date.UTC(2026, 1, 28)),
      totalVolume: 3_069_000,
      caseCount: 31,
      appliedRate: 5,
      paybackAmount: 153_450,
      status: 'PENDING',
      settledAt: new Date(Date.UTC(2026, 2, 25)),
    },
    {
      hospitalId: mireHospitalId,
      settlementPeriodStart: new Date(Date.UTC(2026, 2, 1)),
      settlementPeriodEnd: new Date(Date.UTC(2026, 2, 31)),
      totalVolume: 2_079_000,
      caseCount: 10,
      appliedRate: 5,
      paybackAmount: 103_950,
      status: 'PENDING',
      settledAt: new Date(Date.UTC(2026, 3, 25)),
    },
  ];

  for (const s of settlementSeeds) {
    const existing = await prisma.settlement.findFirst({
      where: {
        hospitalId: s.hospitalId,
        settlementPeriodStart: s.settlementPeriodStart,
      },
    });
    if (!existing) {
      await prisma.settlement.create({ data: s });
    }
  }
  console.log('✅ mire@example.com 정산 더미 생성 완료');

  // ── SystemConfig 초기값 ──
  const systemConfigSeeds = [
    {
      key: 'DEFAULT_PAYBACK_RATE',
      value: '5.00',
      description: '기본 페이백 비율 (%)',
    },
    { key: 'POS_FEE_RATE', value: '1.50', description: 'POS 수수료율 (%)' },
    {
      key: 'FIXED_PAYMENT_PER_CASE',
      value: '30000',
      description: '건당 고정 금액 (원)',
    },
    {
      key: 'SETTLEMENT_PAYMENT_DAY',
      value: '25',
      description: '매월 정산 지급 예정일',
    },
  ];

  for (const config of systemConfigSeeds) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
  }

  console.log('✅ SystemConfig 초기값 생성 완료');

  // -- wallet 알림 초기값 --
  const count = await prisma.walletNotificationSetting.count();
  if (count === 0) {
    await prisma.walletNotificationSetting.create({
      data: {
        minBalanceAvax: '10',
        notificationEmail: 'admin@mire.com',
      },
    });
    console.log('✅ WalletNotificationSetting 초기값 생성 완료');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
