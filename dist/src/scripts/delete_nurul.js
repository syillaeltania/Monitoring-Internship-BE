import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const id = 'cmr1vfjkg0000rpimasnuxsbg';
    const result = await prisma.intern.delete({
        where: { id },
    });
    console.log('Successfully deleted:', result);
}
main()
    .catch(e => console.error('Error during deletion:', e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=delete_nurul.js.map