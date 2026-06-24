import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  calculateMonthlyCost,
  calculateStatus,
  detectNotifications,
  evaluateReplacementStatus,
  excelSerialToDate,
  formatDuration,
} from '../src/domain/internship.logic.ts';

test('calculates automatic lifecycle status and respects terminated override', () => {
  const today = new Date('2026-06-18T00:00:00.000Z');

  assert.equal(calculateStatus('2026-07-01', '2026-12-31', today), 'PLANNED');
  assert.equal(calculateStatus('2026-01-01', '2026-12-31', today), 'ACTIVE');
  assert.equal(calculateStatus('2026-01-01', '2026-02-01', today), 'COMPLETED');
  assert.equal(calculateStatus('2026-01-01', '2026-12-31', today, true), 'TERMINATED');
});

test('calculates duration with Indonesian month and day labels', () => {
  assert.equal(formatDuration('2026-01-10', '2026-04-25'), '3 Bulan - 15 Hari');
});

test('converts Excel serial date into ISO date', () => {
  assert.equal(excelSerialToDate(45838), '2025-06-30');
});

test('calculates institution and professional monthly costs', () => {
  assert.deepEqual(
    calculateMonthlyCost({
      type: 'INSTITUTION',
      baseSalary: 0,
      mealAllowancePerDay: 25000,
      workingDays: 22,
      attendanceDays: 20,
    }),
    {
      totalMealAllowance: 500000,
      totalMonthlyCost: 500000,
    },
  );

  assert.deepEqual(
    calculateMonthlyCost({
      type: 'PROFESSIONAL',
      baseSalary: 1800000,
      mealAllowancePerDay: 25000,
      workingDays: 22,
      attendanceDays: 20,
    }),
    {
      totalMealAllowance: 500000,
      totalMonthlyCost: 2300000,
    },
  );
});

test('evaluates replacement risk for institution internship teams', () => {
  const today = new Date('2026-06-18T00:00:00.000Z');

  assert.equal(
    evaluateReplacementStatus({
      activeInstitutionCount: 0,
      soonestEndDate: null,
      replacementCandidate: '',
      minimumInstitutionNeed: 1,
      today,
    }),
    'URGENT_EMPTY',
  );

  assert.equal(
    evaluateReplacementStatus({
      activeInstitutionCount: 1,
      soonestEndDate: addDays(today, 20),
      replacementCandidate: '',
      minimumInstitutionNeed: 1,
      today,
    }),
    'NEEDS_REPLACEMENT',
  );

  assert.equal(
    evaluateReplacementStatus({
      activeInstitutionCount: 1,
      soonestEndDate: addDays(today, 20),
      replacementCandidate: 'Dian Juliana',
      minimumInstitutionNeed: 1,
      today,
    }),
    'COVERED',
  );
});

test('detects dashboard notifications', () => {
  const today = new Date('2026-06-18T00:00:00.000Z');
  const notifications = detectNotifications({
    today,
    interns: [
      {
        id: 'i1',
        name: 'Rizkia',
        startDate: '2026-02-05',
        endDate: '2026-07-05',
        status: 'ACTIVE',
        type: 'INSTITUTION',
        division: 'CORE',
        team: 'FINANCE',
        acceptanceLetterSent: true,
        completionComplete: true,
      },
      {
        id: 'i2',
        name: 'Candidate',
        startDate: '2026-06-23',
        endDate: '2026-12-23',
        status: 'PLANNED',
        type: 'PROFESSIONAL',
        division: 'MSOS',
        team: 'SQ',
        acceptanceLetterSent: false,
        completionComplete: false,
      },
    ],
    teamRequirements: [
      {
        id: 'r1',
        division: 'MSOS',
        team: 'MSO 2',
        activeInstitutionCount: 0,
        activeProfessionalCount: 0,
        minimumInstitutionNeed: 1,
        soonestEndDate: null,
        replacementCandidate: '',
      },
    ],
  });

  assert.deepEqual(
    notifications.map((item) => item.type),
    ['ENDING_SOON', 'ACCEPTANCE_LETTER_PENDING', 'PLAN_STARTING_SOON', 'TEAM_EMPTY'],
  );
});
