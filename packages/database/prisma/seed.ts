// 데이터베이스 시드 스크립트

import 'dotenv/config';
import { prisma } from '../src/client.ts';
import bcrypt from 'bcryptjs';

async function main() {
  // SUPER_ADMIN 계정 생성
  const passwordHash = bcrypt.hashSync('admin123', 10); // 비밀번호

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
