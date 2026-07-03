import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.intern.updateMany({
    where: { name: { contains: 'Faliq' } },
    data: { division: 'BUSDEV', team: 'SMART', leader: 'Rahadi', position: 'Webdev' }
  });
  await prisma.internshipPlan.updateMany({
    where: { name: { contains: 'Faliq' } },
    data: { targetDivision: 'BUSDEV', targetTeam: 'SMART', leader: 'Rahadi', notes: 'Webdev' }
  });

  await prisma.intern.updateMany({
    where: { name: { contains: 'Wahyu Aji Firnandh' } },
    data: { division: 'CORE', team: 'LOGISTIK', leader: 'Soleh', position: 'Logistik' }
  });
  await prisma.internshipPlan.updateMany({
    where: { name: { contains: 'Wahyu Aji Firnandh' } },
    data: { targetDivision: 'CORE', targetTeam: 'LOGISTIK', leader: 'Soleh', notes: 'Logistik' }
  });

  console.log("Updated Faliq and Wahyu.");
}
main().finally(() => prisma.$disconnect());
