import test from 'node:test';
import assert from 'node:assert/strict';
import { AppService } from '../src/app/app.service.ts';

const completeExitChecklistPayload = {
  companyLaptopReturned: true,
  idCardReturned: true,
  companyEmailClosed: true,
  gitAccountClosed: true,
  knowledgeAccountClosed: true,
  handoverCompleted: true,
  financeCleared: true,
  reportApproved: true,
  academyAccountClosed: true,
  leaderAssessmentFilled: true,
  internFeedbackFilled: true,
  workGroupsLeft: true,
};

test('updateIntern normalizes date fields and recalculates duration label', async () => {
  let receivedData: Record<string, unknown> | undefined;
  const service = new AppService({
    intern: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        receivedData = data;
        return { id: 'intern-1', ...data };
      },
    },
  } as never);

  await service.updateIntern('intern-1', {
    name: 'Updated Intern',
    startDate: '2026-01-10',
    endDate: '2026-04-25',
    manualStatus: 'TERMINATED',
  });

  assert.equal((receivedData?.startDate as Date).toISOString(), '2026-01-10T00:00:00.000Z');
  assert.equal((receivedData?.endDate as Date).toISOString(), '2026-04-25T00:00:00.000Z');
  assert.equal(receivedData?.durationLabel, '3 Bulan - 15 Hari');
  assert.equal(receivedData?.manualStatus, 'TERMINATED');
});

test('deleteIntern removes participant by id', async () => {
  let deletedId = '';
  const service = new AppService({
    intern: {
      delete: async ({ where }: { where: { id: string } }) => {
        deletedId = where.id;
        return { id: where.id };
      },
    },
  } as never);

  await service.deleteIntern('intern-1');

  assert.equal(deletedId, 'intern-1');
});

test('updateCompletion upserts checklist and marks final status complete only when all items are checked', async () => {
  let receivedPayload: Record<string, unknown> | undefined;
  const service = new AppService({
    completionChecklist: {
      upsert: async (payload: Record<string, unknown>) => {
        receivedPayload = payload;
        return { id: 'checklist-1', ...(payload.update as Record<string, unknown>) };
      },
    },
    intern: {
      findUnique: async () => null,
    },
  } as never);

  const result = await service.updateCompletion('intern-1', {
    ...completeExitChecklistPayload,
    notes: 'Selesai administrasi',
  });

  assert.deepEqual(receivedPayload?.where, { internId: 'intern-1' });
  assert.equal((receivedPayload?.create as Record<string, unknown>)?.internId, 'intern-1');
  assert.equal((receivedPayload?.update as Record<string, unknown>)?.finalStatus, 'Lengkap');
  assert.equal((receivedPayload?.update as Record<string, unknown>)?.notes, 'Selesai administrasi');
  assert.equal((result as Record<string, unknown>).finalStatus, 'Lengkap');
});

test('updateCompletion keeps final status incomplete when any checklist item is missing', async () => {
  let updateData: Record<string, unknown> | undefined;
  const service = new AppService({
    completionChecklist: {
      upsert: async (payload: Record<string, unknown>) => {
        updateData = payload.update as Record<string, unknown>;
        return { id: 'checklist-1', ...updateData };
      },
    },
  } as never);

  await service.updateCompletion('intern-1', {
    ...completeExitChecklistPayload,
    reportApproved: false,
  });

  assert.equal(updateData?.reportApproved, false);
  assert.equal(updateData?.finalStatus, 'Belum Lengkap');
});

test('getCompletion returns active participants even when checklist has not been created yet', async () => {
  const service = new AppService({
    intern: {
      findMany: async () => [
        {
          id: 'active-intern',
          name: 'Active Intern',
          type: 'INSTITUTION',
          division: 'CORE',
          team: 'HCM',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-12-31T00:00:00.000Z'),
          manualStatus: null,
          checklist: null,
        },
        {
          id: 'finished-intern',
          name: 'Finished Intern',
          type: 'INSTITUTION',
          division: 'CORE',
          team: 'HCM',
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-12-31T00:00:00.000Z'),
          manualStatus: null,
          checklist: null,
        },
      ],
    },
  } as never);

  const rows = await service.getCompletion(new Date('2026-06-23T00:00:00.000Z'));

  assert.equal(rows.length, 1);
  assert.equal(rows[0].internId, 'active-intern');
  assert.equal(rows[0].intern?.name, 'Active Intern');
  assert.equal(rows[0].companyLaptopReturned, false);
  assert.equal(rows[0].finalStatus, 'Belum Lengkap');
});

test('updateCompletion marks matching internship plan completed when all checklist items are complete', async () => {
  let updatedPlanPayload: Record<string, unknown> | undefined;
  const service = new AppService({
    completionChecklist: {
      upsert: async (payload: Record<string, unknown>) => ({ id: 'checklist-1', ...(payload.update as Record<string, unknown>) }),
    },
    intern: {
      findUnique: async () => ({
        id: 'intern-1',
        name: 'Candidate HCM',
        type: 'INSTITUTION',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      }),
    },
    internshipPlan: {
      updateMany: async (payload: Record<string, unknown>) => {
        updatedPlanPayload = payload;
        return { count: 1 };
      },
    },
  } as never);

  await service.updateCompletion('intern-1', {
    ...completeExitChecklistPayload,
  });

  assert.deepEqual(updatedPlanPayload, {
    where: {
      name: 'Candidate HCM',
      type: 'INSTITUTION',
      plannedStartDate: new Date('2026-06-01T00:00:00.000Z'),
    },
    data: { processStatus: 'COMPLETED' },
  });
});
