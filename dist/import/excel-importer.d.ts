import { PrismaClient } from '@prisma/client';
export declare function extractMonthlyCostValues(raw: unknown[][], rowIndex: number, type: 'INSTITUTION' | 'PROFESSIONAL'): {
    month: number;
    year: number;
    value: number;
}[];
export declare function buildMonthlyCostPayload(type: 'INSTITUTION' | 'PROFESSIONAL', month: number, year: number, value: number): {
    month: number;
    year: number;
    baseSalary: number;
    mealAllowancePerDay: number;
    workingDays: number;
    attendanceDays: number;
    totalMealAllowance: number;
    totalMonthlyCost: number;
};
export declare function importWorkbook(path: string, prisma: PrismaClient): Promise<{
    message: string;
    counters: {
        institutionInterns: number;
        professionalInterns: number;
        plans: number;
        replacement: number;
        evaluations: number;
    };
}>;
