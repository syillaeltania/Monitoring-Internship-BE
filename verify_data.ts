import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const interns = await prisma.intern.count();
  const costs = await prisma.monthlyCost.count();
  const plans = await prisma.internshipPlan.count();
  const reqs = await prisma.teamRequirement.count();
  
  const activeInterns = await prisma.intern.count({
    where: { status: 'ACTIVE' }
  });
  
  console.log(`Interns: ${interns}`);
  console.log(`Costs: ${costs}`);
  console.log(`Plans: ${plans}`);
  console.log(`Reqs: ${reqs}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
