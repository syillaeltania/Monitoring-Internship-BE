import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const duplicateNames = [
    "Aigretта Манarani",
    "Banu Arief Muzaki",
    "Ujang Ilham Nur Zamzam",
    "Yulita"
  ];

  const interns = await prisma.intern.findMany({
    where: {
      name: { in: duplicateNames },
    },
    orderBy: [
      { name: 'asc' },
      { startDate: 'asc' }
    ]
  });

  console.log('--- DUPLICATE INTERNS DETAILS ---');
  console.log(JSON.stringify(interns.map(i => ({
    id: i.id,
    name: i.name,
    type: i.type,
    institution: i.institution,
    division: i.division,
    team: i.team,
    startDate: i.startDate.toISOString().slice(0, 10),
    endDate: i.endDate.toISOString().slice(0, 10),
    sourceSheet: i.sourceSheet,
    createdAt: i.createdAt.toISOString()
  })), null, 2));

  // Let's also check plans for these names
  const plans = await prisma.internshipPlan.findMany({
    where: {
      name: { in: duplicateNames },
    }
  });

  console.log('--- PLANS FOR DUPLICATE NAMES ---');
  console.log(JSON.stringify(plans.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    plannedStartDate: p.plannedStartDate.toISOString().slice(0, 10),
    plannedEndDate: p.plannedEndDate.toISOString().slice(0, 10),
    processStatus: p.processStatus,
    sourceSheet: p.sourceSheet
  })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
