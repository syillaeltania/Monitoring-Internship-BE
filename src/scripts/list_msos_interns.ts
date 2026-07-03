import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const calculateStatus = (startDateStr: string, endDateStr: string, today = new Date(), isTerminated = false): 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' => {
  if (isTerminated) return 'TERMINATED';
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (current < start) return 'PLANNED';
  if (current > end) return 'COMPLETED';
  return 'ACTIVE';
};

async function main() {
  const interns = await prisma.intern.findMany({
    orderBy: { name: 'asc' },
  });

  const formatted = interns.map(i => {
    const status = calculateStatus(
      i.startDate.toISOString().slice(0, 10),
      i.endDate.toISOString().slice(0, 10),
      new Date('2026-07-01'), // check for July 1st, 2026!
      i.manualStatus === 'TERMINATED'
    );
    return {
      id: i.id,
      name: i.name,
      division: i.division,
      team: i.team,
      startDate: i.startDate.toISOString().slice(0, 10),
      endDate: i.endDate.toISOString().slice(0, 10),
      status,
      type: i.type
    };
  });

  console.log('--- ALL INTERNS WITH STATUS FOR 1 JUL 2026 ---');
  console.log(JSON.stringify(formatted.filter(f => f.status === 'ACTIVE'), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
