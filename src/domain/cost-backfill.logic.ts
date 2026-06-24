import type { InternshipType } from './internship.logic.js';

export interface MonthYear {
  month: number;
  year: number;
}

export interface ExistingCost {
  totalMonthlyCost: number;
}

const toUtcDate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  return new Date(`${value}T00:00:00.000Z`);
};

const monthStart = (year: number, month: number): Date => new Date(Date.UTC(year, month - 1, 1));
const monthEnd = (year: number, month: number): Date => new Date(Date.UTC(year, month, 0));

export function getActiveMonthsInYears(startDate: Date | string, endDate: Date | string, years: number[]): MonthYear[] {
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);
  const output: MonthYear[] = [];

  for (const year of years) {
    for (let month = 1; month <= 12; month += 1) {
      if (start <= monthEnd(year, month) && end >= monthStart(year, month)) {
        output.push({ month, year });
      }
    }
  }

  return output;
}

export function inferProfessionalMonthlyCost(existingCosts: ExistingCost[]): number {
  const latestPositive = existingCosts.find((cost) => cost.totalMonthlyCost > 0);
  return latestPositive?.totalMonthlyCost ?? 1800000;
}

export function inferInstitutionMonthlyCost(existingCosts: ExistingCost[], year?: number): number {
  if (year === 2024 || year === 2025) return 700000;

  const latestPositive = existingCosts.find((cost) => cost.totalMonthlyCost > 0);
  return latestPositive?.totalMonthlyCost ?? 500000;
}

export function buildBackfillCostPayload(type: InternshipType, month: number, year: number, monthlyCost: number) {
  if (type === 'INSTITUTION') {
    return {
      month,
      year,
      baseSalary: 0,
      mealAllowancePerDay: 25000,
      workingDays: 20,
      attendanceDays: 20,
      totalMealAllowance: monthlyCost,
      totalMonthlyCost: monthlyCost,
    };
  }

  return {
    month,
    year,
    baseSalary: monthlyCost,
    mealAllowancePerDay: 0,
    workingDays: 20,
    attendanceDays: 0,
    totalMealAllowance: 0,
    totalMonthlyCost: monthlyCost,
  };
}
