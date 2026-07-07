import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE auth.users 
    SET encrypted_password = crypt('HcmLeader@2026', gen_salt('bf')) 
    WHERE email = 'hcm.staff.monitoring@gmail.com'
  `;
  console.log('Updated rows:', result);
  await prisma.$disconnect();
}

main().catch(console.error);
