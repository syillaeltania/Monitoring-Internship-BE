import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Intern" ADD COLUMN "qaSelfLearning" BOOLEAN;`);
    console.log('Added qaSelfLearning');
  } catch (e) { console.error(e.message); }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Intern" ADD COLUMN "qaPretestScore" DOUBLE PRECISION;`);
    console.log('Added qaPretestScore');
  } catch (e) { console.error(e.message); }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Intern" ADD COLUMN "qaPosttestScore" DOUBLE PRECISION;`);
    console.log('Added qaPosttestScore');
  } catch (e) { console.error(e.message); }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Intern" ADD COLUMN "qaNotes" TEXT;`);
    console.log('Added qaNotes');
  } catch (e) { console.error(e.message); }
}

main().catch(console.error).finally(() => prisma.$disconnect());
