const toUtcDate = (value) => {
    if (value instanceof Date) {
        return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    return new Date(`${value}T00:00:00.000Z`);
};
const monthStart = (year, month) => new Date(Date.UTC(year, month - 1, 1));
const monthEnd = (year, month) => new Date(Date.UTC(year, month, 0));
export function getActiveMonthsInYears(startDate, endDate, years) {
    const start = toUtcDate(startDate);
    const end = toUtcDate(endDate);
    const output = [];
    for (const year of years) {
        for (let month = 1; month <= 12; month += 1) {
            if (start <= monthEnd(year, month) && end >= monthStart(year, month)) {
                output.push({ month, year });
            }
        }
    }
    return output;
}
export function inferProfessionalMonthlyCost(existingCosts) {
    const latestPositive = existingCosts.find((cost) => cost.totalMonthlyCost > 0);
    return latestPositive?.totalMonthlyCost ?? 1800000;
}
export function inferInstitutionMonthlyCost(existingCosts, year) {
    if (year === 2024 || year === 2025)
        return 700000;
    const latestPositive = existingCosts.find((cost) => cost.totalMonthlyCost > 0);
    return latestPositive?.totalMonthlyCost ?? 500000;
}
export function buildBackfillCostPayload(type, month, year, monthlyCost) {
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
//# sourceMappingURL=cost-backfill.logic.js.map