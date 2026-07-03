import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const updates = [
    { name: 'Nezya Zulfa Fauziah', division: 'TELCO', team: 'TELCO-2', leader: 'Ridho', position: 'QA' },
    { name: 'Daffa Muzhaffar', division: 'NEW BUSINESS', team: 'NB-6', leader: 'Rijal', position: 'QA' },
    { name: 'Faliq Shiddiq', division: 'BUSDEV', team: 'SMART', leader: 'Rahadi', position: 'Webdev' },
    { name: 'Fawwaz Naufal Anwar', division: 'MSOS', team: 'MSO-5', leader: 'Indra Nugraha', position: 'TS' },
    { name: 'Fithri Khairunnissa', division: 'TELCO', team: 'TELCO-3', leader: 'Fitrian', position: 'QA' },
    { name: 'Abiyya Hamdan Nurwandha', division: 'BUSDEV', team: 'AI Development', leader: 'Arrival', position: 'Webdev' }, // Standardized
    { name: 'Muhammad Razan Muzhaffar', division: 'MSOS', team: 'MSO-5', leader: 'Indra Nugraha', position: 'TS' },
    { name: 'Aliyyi Akbar El Khomeini', division: 'NEW BUSINESS', team: 'NB-5', leader: 'Farid', position: 'QA' },
    { name: 'Ardhifasya Arrasyi', division: 'BUSDEV', team: 'SMART', leader: 'Rahadi', position: 'PR' },
    { name: 'Aldi Cahyadi', division: 'CORE', team: 'LOGISTIK', leader: 'Soleh', position: 'Logistik' },
    { name: 'Nazri Fatih Altaf', division: 'NEW BUSINESS', team: 'NB-4 (Pegadaian)', leader: 'Yusuf Eka', position: 'QA' }, // Standardized
    { name: 'Indri Yani', division: 'MSOS', team: 'MSO-6', leader: 'Fachrurrozy', position: 'TW' },
    { name: 'Karina Yuliani', division: 'BUSDEV', team: 'SMART', leader: 'Rahadi', position: 'PR' },
    { name: 'Milka Nastiti Supritha', division: 'CORE', team: 'FINANCE', leader: 'Irena', position: 'Finance' },
    { name: 'Reva Anindintha', division: 'CORE', team: 'FINANCE', leader: 'Irena', position: 'Finance' },
    { name: 'Masaldi Kharisma Muckti', division: 'NEW BUSINESS', team: 'NB-2 (PGN)', leader: 'Hafiz', position: 'QA' },
    { name: 'Yulita', division: 'BUSDEV', team: 'AM', leader: 'Fajar', position: 'TW' },
    { name: 'Ujang Ilham Nur Zamzam', division: 'NEW BUSINESS', team: 'NB-3 (PGN Billing)', leader: 'Indra Firdaus', position: 'QA' }, // Standardized
    { name: 'Hilarius Rysfi Adi Kurnia', division: 'NEW BUSINESS', team: 'NB-3 (PGN Billing)', leader: 'Indra Firdaus', position: 'QA' }, // Standardized
    { name: 'M Iqbal Saepul Bahri', division: 'NEW BUSINESS', team: 'NB-3 (PGN Billing)', leader: 'Indra Firdaus', position: 'QA' }, // Standardized
    { name: 'Meida Nur Janah', division: 'BUSDEV', team: 'SMART', leader: 'Rahadi', position: 'Admin' },
    { name: 'Randi Gunawan', division: 'CORE', team: 'CLC', leader: 'Rangga', position: 'Admin' },
    { name: 'Aigret', division: 'NEW BUSINESS', team: 'NB-2 (TSEL)', leader: 'Hafiz', position: 'QA' },
    { name: 'Banu Arief Muzaki', division: 'TELCO', team: 'TELCO-1', leader: 'Arif Maulana', position: 'QA' },
    { name: 'Fikran Mahdan Nuha', division: 'NEW BUSINESS', team: 'NB-2 (PGN)', leader: 'Hafiz', position: 'QA' },
    { name: 'Wahyu Aji Firnandha', division: 'CORE', team: 'LOGISTIK', leader: 'Soleh', position: 'Logistik' },
    { name: 'Nurul Fauziyah Arifin', division: 'TELCO', team: 'TELCO-1', leader: 'Arif Maulana', position: 'QA' },
    { name: 'Salsa Fauzia', division: 'CORE', team: 'HCM', leader: 'Ryan', position: 'Admin' },
    { name: 'Rizkia Fawziya', division: 'CORE', team: 'FINANCE', leader: 'Irena', position: 'Admin' },
    { name: 'Dian Nurdianti', division: 'CORE', team: 'LOGISTIK', leader: 'Soleh', position: 'Admin' },
    { name: 'Muhammad Jahran', division: 'NEW BUSINESS', team: 'NB-3', leader: 'Indra Firdaus', position: 'QA' },
    { name: 'Dian Juliana', division: 'BUSDEV', team: 'AM', leader: 'Fajar', position: 'TW' },
];
async function main() {
    let updatedCount = 0;
    for (const update of updates) {
        const interns = await prisma.intern.findMany({
            where: { name: { contains: update.name } },
        });
        if (interns.length === 0) {
            console.log(`❌ Not found: ${update.name}`);
            continue;
        }
        if (interns.length > 1) {
            console.log(`⚠️ Multiple found for ${update.name}, updating all...`);
        }
        for (const intern of interns) {
            await prisma.intern.update({
                where: { id: intern.id },
                data: {
                    division: update.division,
                    team: update.team,
                    leader: update.leader,
                    position: update.position,
                },
            });
            // Update the plan as well so it doesn't get overwritten on sync
            await prisma.internshipPlan.updateMany({
                where: { name: intern.name },
                data: {
                    targetDivision: update.division,
                    targetTeam: update.team,
                    leader: update.leader,
                    notes: update.position, // Assuming position mapped to notes on plans
                },
            });
            console.log(`✅ Updated: ${intern.name} -> ${update.division} | ${update.team} | ${update.leader}`);
            updatedCount++;
        }
    }
    console.log(`\n🎉 Successfully updated ${updatedCount} records.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=update_participants_from_ss.js.map