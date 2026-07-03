import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const i = await prisma.intern.findMany({ where: { division: 'MSOS' } });
  console.log(i.map(x => `${x.name} | ${x.team} | ${x.status} | ${x.type}`));
}
main().finally(() => prisma.$disconnect());
