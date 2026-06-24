import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { importWorkbook } from '../import/excel-importer.js';
const prisma = new PrismaClient();
const path = process.argv[2] ?? process.env.EXCEL_PATH ?? '/Users/syilla/Downloads/Data Magang Neuron.xlsx';
try {
    if (!existsSync(path)) {
        throw new Error(`Workbook Excel tidak ditemukan: ${path}`);
    }
    const result = await importWorkbook(path, prisma);
    console.log(JSON.stringify(result, null, 2));
}
finally {
    await prisma.$disconnect();
}
//# sourceMappingURL=seed.js.map