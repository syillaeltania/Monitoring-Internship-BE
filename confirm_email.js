import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE email = 'hcm.staff.monitoring@gmail.com'
  `;
  console.log('Updated rows:', result);
  await prisma.$disconnect();
}

main().catch(console.error);
