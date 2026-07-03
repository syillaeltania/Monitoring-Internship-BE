import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const meida = await prisma.intern.findMany({ where: { name: { contains: 'Meida' } } });
  console.dir(meida, { depth: null });
}
main().finally(() => prisma.$disconnect());
