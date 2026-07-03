import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const i = await prisma.intern.findMany({ where: { name: { contains: 'Noval' } } });
  console.log(i.map(x => `${x.name} | ${x.division} | ${x.team} | ${x.position} | ${x.type}`));
}
main().finally(() => prisma.$disconnect());
