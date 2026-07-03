import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkData() {
    const interns = await prisma.intern.findMany({
        where: {
            name: {
                in: [
                    "Muhammad Jahran",
                    "Dian Juliana",
                    "Adhitia Darma",
                    "Ahmad Bima",
                    "Rafi Adnan",
                    "Adnan Hasan",
                    "M. Rizal",
                    "M. Fadhlan",
                    "Fajar Siddiq",
                    "Rizky Ramadhan",
                    "M. Zaidan",
                    "Alya Nabila",
                    "Nurul Hidayah",
                    "Siti Aminah",
                    "Budi Santoso",
                    "Agus Supriyadi",
                    "Dimas Aditya"
                ]
            }
        }
    });
    console.log(interns.map(i => ({ name: i.name, division: i.division, team: i.team, leader: i.leader })));
    const teamReqs = await prisma.teamRequirement.count();
    console.log("TeamRequirement count:", teamReqs);
}
checkData().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_data.js.map