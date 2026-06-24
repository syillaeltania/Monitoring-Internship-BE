import type { InternshipType } from './internship.logic.js';
export interface MonthYear {
    month: number;
    year: number;
}
export interface ExistingCost {
    totalMonthlyCost: number;
}
export declare function getActiveMonthsInYears(startDate: Date | string, endDate: Date | string, years: number[]): MonthYear[];
export declare function inferProfessionalMonthlyCost(existingCosts: ExistingCost[]): number;
export declare function inferInstitutionMonthlyCost(existingCosts: ExistingCost[], year?: number): number;
export declare function buildBackfillCostPayload(type: InternshipType, month: number, year: number, monthlyCost: number): {
    month: number;
    year: number;
    baseSalary: number;
    mealAllowancePerDay: number;
    workingDays: number;
    attendanceDays: number;
    totalMealAllowance: number;
    totalMonthlyCost: number;
};
