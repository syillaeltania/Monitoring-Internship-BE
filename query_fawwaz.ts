import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const i = await prisma.intern.findMany({ where: { name: { contains: 'Fawwaz' } } });
  console.log(i.map(x => `${x.name} | ${x.startDate} | ${x.endDate}`));
}
main().finally(() => prisma.$disconnect());
