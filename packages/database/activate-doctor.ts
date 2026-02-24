// doctor@mire.com 계정 활성화
import 'dotenv/config';
import { prisma } from './src/client';

async function activateDoctor() {
  const result = await prisma.user.update({
    where: { email: 'doctor@mire.com' },
    data: { status: 'ACTIVE' },
  });

  console.log('✅ doctor@mire.com 계정이 활성화되었습니다');
  console.log('  - 이메일:', result.email);
  console.log('  - 상태:', result.status);
  console.log('  - 역할:', result.role);
}

activateDoctor()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
