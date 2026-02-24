// DB에서 doctor@mire.com 계정 확인
import 'dotenv/config';
import { prisma } from './src/client';
import bcrypt from 'bcryptjs';

async function checkUser() {
  const email = 'doctor@mire.com';
  const password = 'doctor123';

  const user = await prisma.user.findUnique({
    where: { email },
    include: { hospital: true },
  });

  if (!user) {
    console.log('❌ 사용자를 찾을 수 없습니다:', email);
    return;
  }

  console.log('✅ 사용자 정보:');
  console.log('  - ID:', user.id);
  console.log('  - 이메일:', user.email);
  console.log('  - 이름:', user.name);
  console.log('  - 역할:', user.role);
  console.log('  - 상태:', user.status);
  console.log('  - 병원 ID:', user.hospitalId);
  console.log('  - 병원 상태:', user.hospital?.status);

  // 비밀번호 확인
  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  console.log('  - 비밀번호 일치:', passwordMatch ? '✅' : '❌');

  if (!passwordMatch) {
    console.log('\n🔧 비밀번호를 doctor123으로 재설정합니다...');
    const newHash = bcrypt.hashSync(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    console.log('✅ 비밀번호 재설정 완료');
  }
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
