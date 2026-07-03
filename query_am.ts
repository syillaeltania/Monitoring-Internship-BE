import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const am = await prisma.intern.findMany({ where: { team: 'AM' } });
  console.log(am.map(i => `${i.name} - ${i.position}`));
}
main().finally(() => prisma.$disconnect());
