import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBackfillCostPayload,
  getActiveMonthsInYears,
  inferInstitutionMonthlyCost,
  inferProfessionalMonthlyCost,
} from '../src/domain/cost-backfill.logic.ts';

test('builds active months from internship period across 2024 and 2025', () => {
  assert.deepEqual(getActiveMonthsInYears('2024-11-05', '2025-02-28', [2024, 2025]), [
    { month: 11, year: 2024 },
    { month: 12, year: 2024 },
    { month: 1, year: 2025 },
    { month: 2, year: 2025 },
  ]);
});

test('counts partial month as active when internship overlaps the month', () => {
  assert.deepEqual(getActiveMonthsInYears('2025-06-30', '2025-10-24', [2025]), [
    { month: 6, year: 2025 },
    { month: 7, year: 2025 },
    { month: 8, year: 2025 },
    { month: 9, year: 2025 },
    { month: 10, year: 2025 },
  ]);
});

test('uses default institution monthly cost of 500000 for generated master-data costs', () => {
  assert.deepEqual(buildBackfillCostPayload('INSTITUTION', 6, 2025, 500000), {
    month: 6,
    year: 2025,
    baseSalary: 0,
    mealAllowancePerDay: 25000,
    workingDays: 20,
    attendanceDays: 20,
    totalMealAllowance: 500000,
    totalMonthlyCost: 500000,
  });
});

test('uses inferred professional cost when available and falls back to 1800000', () => {
  assert.equal(inferProfessionalMonthlyCost([{ totalMonthlyCost: 2000000 }, { totalMonthlyCost: 1800000 }]), 2000000);
  assert.equal(inferProfessionalMonthlyCost([]), 1800000);
});

test('uses inferred institution cost when available and falls back to 500000', () => {
  assert.equal(inferInstitutionMonthlyCost([{ totalMonthlyCost: 700000 }]), 700000);
  assert.equal(inferInstitutionMonthlyCost([]), 500000);
});

test('forces institution monthly cost to 700000 for 2024 and 2025', () => {
  assert.equal(inferInstitutionMonthlyCost([], 2024), 700000);
  assert.equal(inferInstitutionMonthlyCost([{ totalMonthlyCost: 500000 }], 2025), 700000);
  assert.equal(inferInstitutionMonthlyCost([], 2026), 500000);
});
