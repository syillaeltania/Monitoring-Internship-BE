import test from 'node:test';
import assert from 'node:assert/strict';
import { AppService } from '../src/app/app.service.ts';

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
