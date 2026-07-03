import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const interns = await prisma.intern.findMany({ select: { team: true, division: true } });
  const plans = await prisma.internshipPlan.findMany({ select: { targetTeam: true, targetDivision: true } });
  const reqs = await prisma.teamRequirement.findMany({ select: { team: true, division: true } });

  const uniqueTeams = new Set<string>();

  interns.forEach(i => uniqueTeams.add(`${i.division} | ${i.team}`));
  plans.forEach(p => uniqueTeams.add(`${p.targetDivision} | ${p.targetTeam}`));
  reqs.forEach(r => uniqueTeams.add(`${r.division} | ${r.team}`));

  console.log('--- UNIQUE TEAMS ---');
  Array.from(uniqueTeams).sort().forEach(t => console.log(t));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
