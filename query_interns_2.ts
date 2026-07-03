import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const i1 = await prisma.intern.findMany({ where: { name: { contains: 'Faliq' } } });
  console.log("Found Faliq:");
  i1.forEach(i => console.log(i.name));

  const i2 = await prisma.intern.findMany({ where: { name: { contains: 'Wahyu' } } });
  console.log("Found Wahyu:");
  i2.forEach(i => console.log(i.name));
}
main().finally(() => prisma.$disconnect());
