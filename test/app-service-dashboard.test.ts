import test from 'node:test';
import assert from 'node:assert/strict';
import { AppService } from '../src/app/app.service.ts';

const activeIntern = (overrides: Record<string, unknown>) => ({
  id: Math.random().toString(36),
  name: 'Intern',
  type: 'INSTITUTION',
  division: 'CORE',
  team: 'HCM',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2099-12-31T00:00:00.000Z'),
  manualStatus: null,
  costs: [],
  checklist: null,
  ...overrides,
});

test('dashboard planned total is sourced from open internship plans', async () => {
  let receivedCountArgs: Record<string, unknown> | undefined;
  const service = new AppService({
    internshipPlan: {
      findMany: async () => [],
      count: async (args: Record<string, unknown>) => {
        receivedCountArgs = args;
        return 2;
      },
    },
    intern: {
      findMany: async () => [],
    },
    teamRequirement: {
      findMany: async () => [],
    },
  } as never);

  const result = await service.getDashboard({});

  assert.equal(result.summary.plannedTotal, 2);
  assert.deepEqual(receivedCountArgs, {
    where: {
      processStatus: {
        notIn: ['ACTIVE', 'COMPLETED', 'COMPLETION_CHECKLIST_DONE'],
      },
    },
  });
});

test('dashboard merges NB and NEW BUSINESS in division chart', async () => {
  const service = new AppService({
    internshipPlan: {
      findMany: async () => [],
      count: async () => 0,
    },
    intern: {
      findMany: async () => [
        activeIntern({ name: 'NB Alias', division: 'NB' }),
        activeIntern({ name: 'New Business Alias', division: 'NEW BUSINESS' }),
        activeIntern({ name: 'Core Intern', division: 'CORE' }),
      ],
    },
    teamRequirement: {
      findMany: async () => [],
    },
  } as never);

  const result = await service.getDashboard({});

  assert.deepEqual(result.charts.byDivision, [
    { name: 'NB', value: 2 },
    { name: 'CORE', value: 1 },
  ]);
});
