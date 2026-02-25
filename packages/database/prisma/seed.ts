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
