import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const i = await prisma.intern.findMany({ where: { name: { contains: 'Nazri Fatih Altaf' } } });
  console.log(i);
}
main().finally(() => prisma.$disconnect());
