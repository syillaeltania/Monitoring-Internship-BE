import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import {
  buildBackfillCostPayload,
  getActiveMonthsInYears,
  inferInstitutionMonthlyCost,
  inferProfessionalMonthlyCost,
} from '../domain/cost-backfill.logic.js';

const prisma = new PrismaClient();
const years = (process.argv[2] ?? '2024,2025,2026')
  .split(',')
  .map((item) => Number(item.trim()))
  .filter((item) => Number.isInteger(item));

try {
  const interns = await prisma.intern.findMany({
    include: {
      costs: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      },
    },
  });

  let created = 0;
  let skippedExisting = 0;

  for (const intern of interns) {
    const existingCosts = intern.costs.map((cost) => ({ totalMonthlyCost: cost.totalMonthlyCost }));

    for (const activeMonth of getActiveMonthsInYears(intern.startDate, intern.endDate, years)) {
      const monthlyCost =
        intern.type === 'INSTITUTION'
          ? inferInstitutionMonthlyCost(existingCosts, activeMonth.year)
          : inferProfessionalMonthlyCost(existingCosts);

      const existing = await prisma.monthlyCost.findUnique({
        where: {
          internId_month_year: {
            internId: intern.id,
            month: activeMonth.month,
            year: activeMonth.year,
          },
        },
      });

      if (existing) {
        skippedExisting += 1;
        continue;
      }

      await prisma.monthlyCost.create({
        data: {
          internId: intern.id,
          ...buildBackfillCostPayload(intern.type, activeMonth.month, activeMonth.year, monthlyCost),
        },
      });
      created += 1;
    }
  }

  console.log(JSON.stringify({ message: 'Backfill cost selesai.', years, created, skippedExisting }, null, 2));
} finally {
  await prisma.$disconnect();
}
