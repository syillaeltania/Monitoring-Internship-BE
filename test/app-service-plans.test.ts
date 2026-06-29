import test from 'node:test';
import assert from 'node:assert/strict';
import { AppService } from '../src/app/app.service.ts';

test('createPlan creates an internship plan with default waiting join status', async () => {
  let receivedData: Record<string, unknown> | undefined;
  const service = new AppService({
    internshipPlan: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        receivedData = data;
        return { id: 'plan-1', ...data };
      },
    },
  } as never);

  await service.createPlan({
    name: 'Candidate HCM',
    type: 'INSTITUTION',
    institution: 'UNLA',
    major: 'Akuntansi',
    targetDivision: 'CORE',
    targetTeam: 'HCM',
    leader: 'Ryan',
    plannedStartDate: '2026-07-01',
    plannedEndDate: '2026-12-31',
    phone: '08123',
    notes: 'Surat diterima',
  });

  assert.equal(receivedData?.name, 'Candidate HCM');
  assert.equal(receivedData?.type, 'INSTITUTION');
  assert.equal(receivedData?.targetDivision, 'CORE');
  assert.equal(receivedData?.targetTeam, 'HCM');
  assert.equal(receivedData?.processStatus, 'WAITING_JOIN');
  assert.equal(receivedData?.sourceSheet, 'Manual Rencana Magang');
  assert.equal((receivedData?.plannedStartDate as Date).toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal((receivedData?.plannedEndDate as Date).toISOString(), '2026-12-31T00:00:00.000Z');
});

test('syncActivePlans promotes active plan period into participant master data', async () => {
  const upserts: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const service = new AppService({
    internshipPlan: {
      findMany: async () => [
        {
          id: 'plan-1',
          name: 'Candidate HCM',
          type: 'INSTITUTION',
          institution: 'UNLA',
          major: 'Akuntansi',
          targetDivision: 'CORE',
          targetTeam: 'HCM',
          leader: 'Ryan',
          plannedStartDate: new Date('2026-06-01T00:00:00.000Z'),
          plannedEndDate: new Date('2026-12-31T00:00:00.000Z'),
          processStatus: 'WAITING_JOIN',
          sourceSheet: 'Manual Rencana Magang',
          phone: '08123',
          notes: 'Surat diterima',
        },
      ],
      update: async (payload: Record<string, unknown>) => {
        updates.push(payload);
        return payload;
      },
    },
    intern: {
      upsert: async (payload: Record<string, unknown>) => {
        upserts.push(payload);
        return { id: 'intern-1' };
      },
    },
  } as never);

  await service.syncActivePlans(new Date('2026-06-23T00:00:00.000Z'));

  assert.equal(upserts.length, 1);
  assert.deepEqual(upserts[0]?.where, {
    name_type_startDate_endDate: {
      name: 'Candidate HCM',
      type: 'INSTITUTION',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    },
  });
  assert.deepEqual((upserts[0]?.create as Record<string, unknown>)?.division, 'CORE');
  assert.deepEqual(updates[0], {
    where: { id: 'plan-1' },
    data: { processStatus: 'ACTIVE' },
  });
});

test('syncActivePlans ignores historical imported plans', async () => {
  const upserts: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  let receivedFindMany: Record<string, unknown> | undefined;
  const importedPlan = {
    id: 'plan-imported',
    name: 'Imported Candidate',
    type: 'INSTITUTION',
    institution: 'UNLA',
    major: 'Akuntansi',
    targetDivision: 'CORE',
    targetTeam: 'HCM',
    leader: 'Ryan',
    plannedStartDate: new Date('2026-06-01T00:00:00.000Z'),
    plannedEndDate: new Date('2026-12-31T00:00:00.000Z'),
    processStatus: 'WAITING_JOIN',
    sourceSheet: 'Rencana Magang ',
    phone: '08123',
    notes: 'Imported row',
  };
  const service = new AppService({
    internshipPlan: {
      findMany: async (payload: Record<string, unknown>) => {
        receivedFindMany = payload;
        return (payload.where as Record<string, unknown>)?.sourceSheet === importedPlan.sourceSheet ? [importedPlan] : [];
      },
      update: async (payload: Record<string, unknown>) => {
        updates.push(payload);
        return payload;
      },
    },
    intern: {
      upsert: async (payload: Record<string, unknown>) => {
        upserts.push(payload);
        return { id: 'intern-1' };
      },
    },
  } as never);

  await service.syncActivePlans(new Date('2026-06-23T00:00:00.000Z'));

  assert.equal((receivedFindMany?.where as Record<string, unknown>)?.sourceSheet, 'Manual Rencana Magang');
  assert.equal(upserts.length, 0);
  assert.equal(updates.length, 0);
});

test('updatePlanStatus updates internship plan process status', async () => {
  let receivedWhere: Record<string, unknown> | undefined;
  let receivedData: Record<string, unknown> | undefined;
  const service = new AppService({
    internshipPlan: {
      update: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        receivedWhere = where;
        receivedData = data;
        return { id: where.id, ...data };
      },
    },
  } as never);

  await service.updatePlanStatus('plan-1', { processStatus: 'COMPLETED' });

  assert.deepEqual(receivedWhere, { id: 'plan-1' });
  assert.deepEqual(receivedData, { processStatus: 'COMPLETED' });
});

test('updatePlanStatus updates editable internship plan fields', async () => {
  let receivedData: Record<string, unknown> | undefined;
  const service = new AppService({
    internshipPlan: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        receivedData = data;
        return { id: 'plan-1', ...data };
      },
    },
  } as never);

  await service.updatePlanStatus('plan-1', {
    name: 'Updated Candidate',
    type: 'PROFESSIONAL',
    institution: 'Tel-U',
    major: 'Sistem Informasi',
    targetDivision: 'MSOS',
    targetTeam: 'SQ',
    leader: 'Agung Laksono',
    acceptanceLetterDate: '2026-06-20',
    plannedStartDate: '2026-07-01',
    plannedEndDate: '2026-12-31',
    documentStatus: 'Lengkap',
    onboardingStatus: 'Belum onboarding',
    processStatus: 'ACCEPTED',
    phone: '08123',
    notes: 'Updated note',
  });

  assert.equal(receivedData?.name, 'Updated Candidate');
  assert.equal(receivedData?.type, 'PROFESSIONAL');
  assert.equal(receivedData?.targetDivision, 'MSOS');
  assert.equal(receivedData?.targetTeam, 'SQ');
  assert.equal(receivedData?.leader, 'Agung Laksono');
  assert.equal(receivedData?.documentStatus, 'Lengkap');
  assert.equal(receivedData?.onboardingStatus, 'Belum onboarding');
  assert.equal(receivedData?.processStatus, 'ACCEPTED');
  assert.equal((receivedData?.acceptanceLetterDate as Date).toISOString(), '2026-06-20T00:00:00.000Z');
  assert.equal((receivedData?.plannedStartDate as Date).toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal((receivedData?.plannedEndDate as Date).toISOString(), '2026-12-31T00:00:00.000Z');
});

test('updatePlanStatus rejects invalid process status values', async () => {
  const service = new AppService({
    internshipPlan: {
      update: async () => {
        throw new Error('should not update');
      },
    },
  } as never);

  await assert.rejects(() => service.updatePlanStatus('plan-1', { processStatus: 'ON_GOING' }), /Invalid process status/);
});
