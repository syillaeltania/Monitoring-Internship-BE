import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reqs = await prisma.teamRequirement.findMany({
    orderBy: [{ division: 'asc' }, { team: 'asc' }]
  });

  console.log('--- ALL TEAM REQUIREMENTS IN DB ---');
  console.log(JSON.stringify(reqs.map(r => ({
    id: r.id,
    division: r.division,
    team: r.team,
    leader: r.leader,
    activeInstitutionCount: r.activeInstitutionCount,
    activeProfessionalCount: r.activeProfessionalCount,
    minimumInstitutionNeed: r.minimumInstitutionNeed,
    endingInternName: r.endingInternName,
    replacementStatus: r.replacementStatus,
  })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
