import test from 'node:test';
import assert from 'node:assert/strict';
import { AppService } from '../src/app/app.service.ts';

const buildIntern = (overrides: Record<string, unknown>) => ({
  id: 'intern-1',
  name: 'Intern Test',
  type: 'INSTITUTION',
  institution: 'SMK',
  major: 'RPL',
  division: 'CORE',
  team: 'LOGISTIK',
  position: 'Admin',
  leader: 'Soleh',
  location: 'Bandung',
  startDate: new Date('2026-03-09T00:00:00.000Z'),
  endDate: new Date('2026-09-09T00:00:00.000Z'),
  durationLabel: null,
  manualStatus: null,
  phone: null,
  email: null,
  notes: null,
  acceptanceLetterSent: false,
  sourceSheet: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  costs: [],
  ...overrides,
});

test('cost endpoint derives missing monthly costs from active master data period', async () => {
  const existingProfessionalCost = {
    id: 'cost-existing',
    internId: 'professional-1',
    benefitSchemeId: null,
    month: 6,
    year: 2026,
    baseSalary: 1800000,
    mealAllowancePerDay: 0,
    workingDays: 20,
    attendanceDays: 0,
    totalMealAllowance: 0,
    totalMonthlyCost: 1800000,
    benefitScheme: null,
    intern: buildIntern({
      id: 'professional-1',
      name: 'Existing Professional',
      type: 'PROFESSIONAL',
      division: 'MSOS',
      team: 'SQ',
      costs: [],
    }),
  };

  const service = new AppService({
    monthlyCost: {
      findMany: async () => [existingProfessionalCost],
    },
    intern: {
      findMany: async () => [
        buildIntern({
          id: 'institution-missing-cost',
          name: 'Missing Institution Cost',
          type: 'INSTITUTION',
          costs: [],
        }),
        buildIntern({
          id: 'professional-1',
          name: 'Existing Professional',
          type: 'PROFESSIONAL',
          division: 'MSOS',
          team: 'SQ',
          costs: [existingProfessionalCost],
        }),
      ],
    },
  } as never);

  const result = await service.getCosts({ month: '6', year: '2026' });

  assert.equal(result.rows.length, 2);
  assert.equal(result.total, 2300000);
  assert.deepEqual(
    result.byType.sort((a, b) => a.name.localeCompare(b.name)),
    [
      { name: 'INSTITUTION', value: 500000 },
      { name: 'PROFESSIONAL', value: 1800000 },
    ],
  );
});

test('updates monthly cost using edited base salary and meal allowance', async () => {
  let receivedArgs: Record<string, unknown> | undefined;
  const service = new AppService({
    monthlyCost: {
      upsert: async (args: Record<string, unknown>) => {
        receivedArgs = args;
        return args;
      },
    },
  } as never);

  await service.updateMonthlyCost('intern-1', 2026, 6, {
    baseSalary: 1200000,
    totalMealAllowance: 700000,
  });

  assert.deepEqual(receivedArgs, {
    where: {
      internId_month_year: {
        internId: 'intern-1',
        month: 6,
        year: 2026,
      },
    },
    create: {
      internId: 'intern-1',
      month: 6,
      year: 2026,
      baseSalary: 1200000,
      mealAllowancePerDay: 25000,
      workingDays: 28,
      attendanceDays: 28,
      totalMealAllowance: 700000,
      totalMonthlyCost: 1900000,
    },
    update: {
      baseSalary: 1200000,
      mealAllowancePerDay: 25000,
      workingDays: 28,
      attendanceDays: 28,
      totalMealAllowance: 700000,
      totalMonthlyCost: 1900000,
    },
  });
});
