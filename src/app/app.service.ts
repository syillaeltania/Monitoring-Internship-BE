import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  calculateMonthlyCost,
  calculateStatus,
  detectNotifications,
  evaluateReplacementStatus,
  formatDuration,
} from '../domain/internship.logic.js';
import {
  buildBackfillCostPayload,
  inferInstitutionMonthlyCost,
  inferProfessionalMonthlyCost,
} from '../domain/cost-backfill.logic.js';
import { importWorkbook } from '../import/excel-importer.js';
import { PrismaService } from '../prisma/prisma.service.js';

const toDate = (value: unknown): Date | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const monthStart = (year: number, month: number): Date => new Date(Date.UTC(year, month - 1, 1));
const monthEnd = (year: number, month: number): Date => new Date(Date.UTC(year, month, 0));
const closedPlanStatuses = ['ACTIVE', 'COMPLETED', 'COMPLETION_CHECKLIST_DONE'] as const;
const validPlanStatuses = [
  'REQUEST_RECEIVED',
  'SCREENING',
  'ACCEPTED',
  'ACCEPTANCE_LETTER_SENT',
  'WAITING_JOIN',
  'ACTIVE',
  'COMPLETED',
  'COMPLETION_CHECKLIST_DONE',
] as const;
const completionChecklistFlags = [
  'companyLaptopReturned',
  'idCardReturned',
  'companyEmailClosed',
  'gitAccountClosed',
  'knowledgeAccountClosed',
  'handoverCompleted',
  'financeCleared',
  'reportApproved',
  'academyAccountClosed',
  'leaderAssessmentFilled',
  'internFeedbackFilled',
  'workGroupsLeft',
] as const;

type MonthlyCostWithRelations = Prisma.MonthlyCostGetPayload<{
  include: { intern: true; benefitScheme: true };
}>;

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: Record<string, string>) {
    await this.syncActivePlans();
    const interns = await this.prisma.intern.findMany({ include: { costs: true, checklist: true } });
    const requirements = await this.prisma.teamRequirement.findMany();
    const today = new Date();
    const normalized = interns.map((intern) => ({
      ...intern,
      computedStatus: calculateStatus(
        intern.startDate.toISOString().slice(0, 10),
        intern.endDate.toISOString().slice(0, 10),
        today,
        intern.manualStatus === 'TERMINATED',
      ),
    }));
    const active = normalized.filter((item) => item.computedStatus === 'ACTIVE');
    const month = Number(query.month ?? today.getUTCMonth() + 1);
    const year = Number(query.year ?? today.getUTCFullYear());
    const monthCosts = interns.flatMap((intern) => intern.costs).filter((cost) => cost.month === month && cost.year === year);
    const plannedTotal = await this.prisma.internshipPlan.count({
      where: { processStatus: { notIn: [...closedPlanStatuses] } },
    });

    return {
      summary: {
        activeTotal: active.length,
        activeInstitution: active.filter((item) => item.type === 'INSTITUTION').length,
        activeProfessional: active.filter((item) => item.type === 'PROFESSIONAL').length,
        completedTotal: normalized.filter((item) => item.computedStatus === 'COMPLETED').length,
        plannedTotal,
        endingIn30Days: active.filter((item) => {
          const days = (item.endDate.getTime() - today.getTime()) / 86400000;
          return days >= 0 && days <= 30;
        }).length,
        riskyTeams: requirements.filter((item) => item.replacementStatus !== 'COVERED').length,
        currentMonthCost: monthCosts.reduce((sum, item) => sum + item.totalMonthlyCost, 0),
      },
      charts: {
        byDivision: this.countBy(active, 'division'),
        byType: this.countBy(active, 'type'),
        monthlyCost: this.monthlyCostSeries(interns.flatMap((intern) => intern.costs)),
      },
      notifications: await this.getNotifications(),
    };
  }

  async getInterns(query: Record<string, string>) {
    await this.syncActivePlans();
    const where: Prisma.InternWhereInput = {
      type: query.type ? (query.type as Prisma.EnumInternshipTypeFilter<'Intern'>) : undefined,
      division: query.division ? { contains: query.division, mode: 'insensitive' } : undefined,
    };
    const interns = await this.prisma.intern.findMany({
      where,
      include: { checklist: true },
      orderBy: [{ division: 'asc' }, { team: 'asc' }, { name: 'asc' }],
    });

    return interns.map((intern) => ({
      ...intern,
      status: calculateStatus(
        intern.startDate.toISOString().slice(0, 10),
        intern.endDate.toISOString().slice(0, 10),
        new Date(),
        intern.manualStatus === 'TERMINATED',
      ),
      durationLabel: intern.durationLabel ?? formatDuration(intern.startDate.toISOString().slice(0, 10), intern.endDate.toISOString().slice(0, 10)),
    }));
  }

  async createIntern(body: Record<string, unknown>) {
    const startDate = toDate(body.startDate) ?? new Date();
    const endDate = toDate(body.endDate) ?? new Date();
    return this.prisma.intern.create({
      data: {
        name: String(body.name ?? ''),
        type: body.type === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'INSTITUTION',
        institution: String(body.institution ?? ''),
        major: String(body.major ?? ''),
        division: String(body.division ?? ''),
        team: String(body.team ?? ''),
        position: String(body.position ?? ''),
        leader: String(body.leader ?? ''),
        location: String(body.location ?? ''),
        startDate,
        endDate,
        durationLabel: formatDuration(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)),
        phone: String(body.phone ?? ''),
        email: String(body.email ?? ''),
        notes: String(body.notes ?? ''),
      },
    });
  }

  async updateIntern(id: string, body: Record<string, unknown>) {
    const data = this.buildInternUpdateData(body);
    return this.prisma.intern.update({
      where: { id },
      data,
    });
  }

  async deleteIntern(id: string) {
    return this.prisma.intern.delete({
      where: { id },
    });
  }

  async getCosts(query: Record<string, string>) {
    const month = query.month ? Number(query.month) : undefined;
    const year = query.year ? Number(query.year) : undefined;
    const costs: MonthlyCostWithRelations[] = await this.prisma.monthlyCost.findMany({
      where: {
        month,
        year,
        intern: query.type ? { type: query.type as Prisma.EnumInternshipTypeFilter<'Intern'> } : undefined,
      },
      include: { intern: true, benefitScheme: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    const completedCosts = month && year ? await this.completeMonthlyCostsFromMasterData(costs, month, year, query) : costs;
    const statusDate = month && year ? monthEnd(year, month) : new Date();
    const filteredCosts = completedCosts
      .map((cost) => {
        const status = calculateStatus(
          cost.intern.startDate.toISOString().slice(0, 10),
          cost.intern.endDate.toISOString().slice(0, 10),
          statusDate,
          cost.intern.manualStatus === 'TERMINATED',
        );
        return {
          ...cost,
          intern: {
            ...cost.intern,
            normalizedDivision: this.normalizeDivision(cost.intern.division),
            status,
          },
        };
      })
      .filter((cost) => !query.division || cost.intern.normalizedDivision === query.division)
      .filter((cost) => !query.status || cost.intern.status === query.status);

    return {
      rows: filteredCosts,
      byDivision: this.sumCosts(filteredCosts, (item) => item.intern.normalizedDivision || item.intern.division),
      byType: this.sumCosts(filteredCosts, (item) => item.intern.type),
      total: filteredCosts.reduce((sum, item) => sum + item.totalMonthlyCost, 0),
    };
  }

  async updateMonthlyCost(internId: string, year: number, month: number, body: Record<string, unknown>) {
    const baseSalary = this.toNonNegativeInt(body.baseSalary);
    const totalMealAllowance = this.toNonNegativeInt(body.totalMealAllowance);
    const totalMonthlyCost = baseSalary + totalMealAllowance;
    const attendanceDays = totalMealAllowance > 0 ? Math.round(totalMealAllowance / 25000) : 0;
    const data = {
      baseSalary,
      mealAllowancePerDay: 25000,
      workingDays: attendanceDays || 20,
      attendanceDays,
      totalMealAllowance,
      totalMonthlyCost,
    };

    return this.prisma.monthlyCost.upsert({
      where: {
        internId_month_year: {
          internId,
          month,
          year,
        },
      },
      create: {
        internId,
        month,
        year,
        ...data,
      },
      update: data,
    });
  }

  private async completeMonthlyCostsFromMasterData(
    costs: MonthlyCostWithRelations[],
    month: number,
    year: number,
    query: Record<string, string>,
  ) {
    const existingInternIds = new Set(costs.map((cost) => cost.internId));
    const activeInterns = await this.prisma.intern.findMany({
      where: {
        type: query.type ? (query.type as Prisma.EnumInternshipTypeFilter<'Intern'>) : undefined,
        startDate: { lte: monthEnd(year, month) },
        endDate: { gte: monthStart(year, month) },
      },
      include: {
        costs: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
      orderBy: [{ division: 'asc' }, { team: 'asc' }, { name: 'asc' }],
    });

    const generatedCosts = activeInterns
      .filter((intern) => !existingInternIds.has(intern.id))
      .map((intern) => {
        const existingCosts = intern.costs.map((cost) => ({ totalMonthlyCost: cost.totalMonthlyCost }));
        const monthlyCost =
          intern.type === 'INSTITUTION'
            ? inferInstitutionMonthlyCost(existingCosts, year)
            : inferProfessionalMonthlyCost(existingCosts);

        return {
          id: `master-${intern.id}-${year}-${month}`,
          internId: intern.id,
          benefitSchemeId: null,
          ...buildBackfillCostPayload(intern.type, month, year, monthlyCost),
          intern,
          benefitScheme: null,
        };
      });

    return [...costs, ...generatedCosts] as MonthlyCostWithRelations[];
  }

  async getReplacement() {
    await this.recalculateTeamRequirements();
    const rows = await this.prisma.teamRequirement.findMany({ orderBy: [{ division: 'asc' }, { team: 'asc' }] });
    return rows.map((row) => ({
      ...row,
      replacementStatus: evaluateReplacementStatus({
        activeInstitutionCount: row.activeInstitutionCount,
        soonestEndDate: row.soonestEndDate,
        replacementCandidate: row.replacementCandidate,
        minimumInstitutionNeed: row.minimumInstitutionNeed,
      }),
    }));
  }

  async getPlans(query: Record<string, string>) {
    await this.syncActivePlans();
    return this.prisma.internshipPlan.findMany({
      where: {
        type: query.type ? (query.type as Prisma.EnumInternshipTypeFilter<'InternshipPlan'>) : undefined,
      },
      orderBy: [{ plannedStartDate: 'asc' }],
    });
  }

  private syncPromise: Promise<void> | null = null;

  async syncActivePlans(today = new Date()) {
    if (this.syncPromise) return this.syncPromise;
    this.syncPromise = this._syncActivePlans(today).finally(() => {
      this.syncPromise = null;
    });
    return this.syncPromise;
  }

  private async _syncActivePlans(today: Date) {
    const current = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const plans = await this.prisma.internshipPlan.findMany({
      where: {
        plannedStartDate: { lte: current },
        plannedEndDate: { gte: current },
        processStatus: { notIn: ['ACTIVE', 'COMPLETED', 'COMPLETION_CHECKLIST_DONE'] },
      },
    });

    for (const plan of plans) {
      const startDate = plan.plannedStartDate;
      const endDate = plan.plannedEndDate;
      const existing = await this.prisma.intern.findFirst({
        where: {
          name: plan.name,
          type: plan.type,
          startDate,
        },
      });

      if (existing) {
        await this.prisma.intern.update({
          where: { id: existing.id },
          data: {
            institution: plan.institution ?? '',
            major: plan.major ?? '',
            division: plan.targetDivision,
            team: plan.targetTeam,
            leader: plan.leader ?? '',
            phone: plan.phone ?? '',
            notes: plan.notes ?? '',
            acceptanceLetterSent: Boolean(plan.acceptanceLetterDate),
            endDate,
            durationLabel: formatDuration(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)),
          },
        });
      } else {
        await this.prisma.intern.create({
          data: {
            name: plan.name,
            type: plan.type,
            institution: plan.institution ?? '',
            major: plan.major ?? '',
            division: plan.targetDivision,
            team: plan.targetTeam,
            position: '',
            leader: plan.leader ?? '',
            location: '',
            startDate,
            endDate,
            durationLabel: formatDuration(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)),
            phone: plan.phone ?? '',
            email: '',
            notes: plan.notes ?? '',
            acceptanceLetterSent: Boolean(plan.acceptanceLetterDate),
            sourceSheet: plan.sourceSheet ?? 'Rencana Magang',
          },
        });
      }

      if (plan.processStatus !== 'ACTIVE') {
        await this.prisma.internshipPlan.update({
          where: { id: plan.id },
          data: { processStatus: 'ACTIVE' },
        });
      }
    }
  }

  async createPlan(body: Record<string, unknown>) {
    const plannedStartDate = toDate(body.plannedStartDate) ?? new Date();
    const plannedEndDate = toDate(body.plannedEndDate) ?? plannedStartDate;
    return this.prisma.internshipPlan.create({
      data: {
        name: String(body.name ?? ''),
        type: body.type === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'INSTITUTION',
        institution: String(body.institution ?? ''),
        major: String(body.major ?? ''),
        targetDivision: String(body.targetDivision ?? ''),
        targetTeam: String(body.targetTeam ?? ''),
        leader: String(body.leader ?? ''),
        acceptanceLetterDate: toDate(body.acceptanceLetterDate),
        plannedStartDate,
        plannedEndDate,
        documentStatus: String(body.documentStatus ?? ''),
        onboardingStatus: String(body.onboardingStatus ?? ''),
        processStatus: 'WAITING_JOIN',
        phone: String(body.phone ?? ''),
        notes: String(body.notes ?? ''),
        sourceSheet: 'Manual Rencana Magang',
      },
    });
  }

  async updatePlanStatus(id: string, body: Record<string, unknown>) {
    const status = body.processStatus;
    if (status !== undefined && (typeof status !== 'string' || !validPlanStatuses.includes(status as (typeof validPlanStatuses)[number]))) {
      throw new Error('Invalid process status');
    }

    const data: Prisma.InternshipPlanUpdateInput = {};
    if (body.name !== undefined) data.name = String(body.name ?? '');
    if (body.type !== undefined) data.type = body.type === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'INSTITUTION';
    if (body.institution !== undefined) data.institution = String(body.institution ?? '');
    if (body.major !== undefined) data.major = String(body.major ?? '');
    if (body.targetDivision !== undefined) data.targetDivision = String(body.targetDivision ?? '');
    if (body.targetTeam !== undefined) data.targetTeam = String(body.targetTeam ?? '');
    if (body.leader !== undefined) data.leader = String(body.leader ?? '');
    if (body.acceptanceLetterDate !== undefined) data.acceptanceLetterDate = toDate(body.acceptanceLetterDate) ?? null;
    if (body.plannedStartDate !== undefined) data.plannedStartDate = toDate(body.plannedStartDate) ?? new Date();
    if (body.plannedEndDate !== undefined) data.plannedEndDate = toDate(body.plannedEndDate) ?? new Date();
    if (body.documentStatus !== undefined) data.documentStatus = String(body.documentStatus ?? '');
    if (body.onboardingStatus !== undefined) data.onboardingStatus = String(body.onboardingStatus ?? '');
    if (body.phone !== undefined) data.phone = String(body.phone ?? '');
    if (body.notes !== undefined) data.notes = String(body.notes ?? '');
    if (typeof status === 'string') data.processStatus = status as Prisma.EnumProcessStatusFieldUpdateOperationsInput['set'];

    return this.prisma.internshipPlan.update({
      where: { id },
      data,
    });
  }

  async deletePlan(id: string) {
    return this.prisma.internshipPlan.delete({
      where: { id },
    });
  }

  async getCompletion(today = new Date()) {
    const interns = await this.prisma.intern.findMany({
      include: { checklist: true },
      orderBy: [{ endDate: 'asc' }, { name: 'asc' }],
    });

    return interns
      .filter(
        (intern) =>
          calculateStatus(
            intern.startDate.toISOString().slice(0, 10),
            intern.endDate.toISOString().slice(0, 10),
            today,
            intern.manualStatus === 'TERMINATED',
          ) === 'ACTIVE',
      )
      .map((intern) => ({
        id: intern.checklist?.id ?? `pending-${intern.id}`,
        internId: intern.id,
        ...Object.fromEntries(completionChecklistFlags.map((flag) => [flag, intern.checklist?.[flag] ?? false])),
        finalStatus: intern.checklist?.finalStatus ?? 'Belum Lengkap',
        notes: intern.checklist?.notes ?? '',
        intern,
      }));
  }

  async updateCompletion(internId: string, body: Record<string, unknown>) {
    const complete = completionChecklistFlags.every((flag) => body[flag] === true);
    const flagData = Object.fromEntries(completionChecklistFlags.map((flag) => [flag, body[flag] === true]));
    const checklist = await this.prisma.completionChecklist.upsert({
      where: { internId },
      create: {
        internId,
        ...flagData,
        finalStatus: complete ? 'Lengkap' : 'Belum Lengkap',
        notes: String(body.notes ?? ''),
      },
      update: {
        ...flagData,
        finalStatus: complete ? 'Lengkap' : 'Belum Lengkap',
        notes: String(body.notes ?? ''),
      },
    });

    if (complete) {
      const intern = await this.prisma.intern.findUnique({ where: { id: internId } });
      if (intern) {
        await this.prisma.internshipPlan.updateMany({
          where: {
            name: intern.name,
            type: intern.type,
            plannedStartDate: intern.startDate,
          },
          data: { processStatus: 'COMPLETED' },
        });
      }
    }

    return checklist;
  }

  async getOrganization() {
    const units = await this.prisma.organizationUnit.findMany({ orderBy: [{ orderNo: 'asc' }, { name: 'asc' }] });
    const interns = await this.getInterns({});
    return { units, activeInterns: interns.filter((item) => item.status === 'ACTIVE') };
  }

  async getNotifications() {
    const interns = await this.getInterns({});
    const requirements = await this.prisma.teamRequirement.findMany();
    return detectNotifications({
      interns: interns.map((intern) => ({
        id: intern.id,
        name: intern.name,
        startDate: intern.startDate.toISOString().slice(0, 10),
        endDate: intern.endDate.toISOString().slice(0, 10),
        status: intern.status,
        type: intern.type,
        division: intern.division,
        team: intern.team,
        acceptanceLetterSent: intern.acceptanceLetterSent,
        completionComplete: intern.checklist?.finalStatus === 'Lengkap',
      })),
      teamRequirements: requirements,
    });
  }

  async importExcel(path: string) {
    const result = await importWorkbook(path, this.prisma);
    await this.recalculateTeamRequirements();
    return result;
  }

  private countBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
    return Object.entries(
      items.reduce<Record<string, number>>((acc, item) => {
        const label = String(item[key] ?? 'Unknown');
        acc[label] = (acc[label] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
  }

  private monthlyCostSeries(costs: { month: number; year: number; totalMonthlyCost: number }[]) {
    const grouped = costs.reduce<Record<string, number>>((acc, item) => {
      const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
      acc[key] = (acc[key] ?? 0) + item.totalMonthlyCost;
      return acc;
    }, {});
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, value }));
  }

  private sumCosts<T extends { totalMonthlyCost: number }>(items: T[], key: (item: T) => string) {
    return Object.entries(
      items.reduce<Record<string, number>>((acc, item) => {
        const label = key(item);
        acc[label] = (acc[label] ?? 0) + item.totalMonthlyCost;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
  }

  private normalizeDivision(value: string) {
    const normalized = value.trim().toUpperCase().replace(/\s+/g, ' ');
    if (normalized === 'NEW BUSINESS' || normalized === 'NB') return 'NB';
    if (normalized === 'TELCO') return 'TELCO';
    if (normalized === 'BUSDEV') return 'BUSDEV';
    if (normalized === 'CORE') return 'CORE';
    if (normalized === 'MSOS') return 'MSOS';
    return value;
  }

  private toNonNegativeInt(value: unknown) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number) || number < 0) return 0;
    return Math.round(number);
  }

  private buildInternUpdateData(body: Record<string, unknown>): Prisma.InternUpdateInput {
    const data: Prisma.InternUpdateInput = {};
    const stringFields = [
      'name',
      'institution',
      'major',
      'division',
      'team',
      'position',
      'leader',
      'location',
      'phone',
      'email',
      'notes',
    ] as const;

    for (const field of stringFields) {
      if (field in body) data[field] = String(body[field] ?? '');
    }

    if (body.type === 'PROFESSIONAL' || body.type === 'INSTITUTION') {
      data.type = body.type;
    }

    if (body.manualStatus === 'PLANNED' || body.manualStatus === 'ACTIVE' || body.manualStatus === 'COMPLETED' || body.manualStatus === 'TERMINATED') {
      data.manualStatus = body.manualStatus;
    } else if (body.manualStatus === null || body.manualStatus === '') {
      data.manualStatus = null;
    }

    const startDate = toDate(body.startDate);
    const endDate = toDate(body.endDate);
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    if (startDate && endDate) {
      data.durationLabel = formatDuration(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10));
    }

    if ('acceptanceLetterSent' in body) {
      data.acceptanceLetterSent = body.acceptanceLetterSent === true;
    }

    return data;
  }

  private recalcPromise: Promise<void> | null = null;

  private async recalculateTeamRequirements() {
    if (this.recalcPromise) return this.recalcPromise;
    this.recalcPromise = this._recalculateTeamRequirements().finally(() => {
      this.recalcPromise = null;
    });
    return this.recalcPromise;
  }

  private async _recalculateTeamRequirements() {
    const activeInterns = (await this.getInterns({})).filter((intern) => intern.status === 'ACTIVE');

    // 1. Reset counts of all existing requirements to 0
    await this.prisma.teamRequirement.updateMany({
      data: {
        activeInstitutionCount: 0,
        activeProfessionalCount: 0,
        soonestEndDate: null,
        endingInternName: null,
      },
    });

    const configs = await this.prisma.teamRequirement.findMany();
    const configMap = new Map<string, typeof configs[number]>();
    const normalizeKey = (div: string, tm: string) => {
      return `${div.trim().toUpperCase()}||${tm.trim()}`;
    };

    for (const config of configs) {
      configMap.set(normalizeKey(config.division, config.team), config);
    }

    // 2. Group active interns by division and team
    const internGroups = new Map<string, typeof activeInterns>();
    for (const intern of activeInterns) {
      const key = `${intern.division.trim().toUpperCase()}||${intern.team.trim()}`;
      internGroups.set(key, [...(internGroups.get(key) ?? []), intern]);
    }

    const processedIds = new Set<string>();

    for (const [key, groupInterns] of internGroups.entries()) {
      const division = groupInterns[0].division;
      const team = groupInterns[0].team;
      const normalized = normalizeKey(division, team);

      const institution = groupInterns.filter((i) => i.type === 'INSTITUTION');
      const professional = groupInterns.filter((i) => i.type === 'PROFESSIONAL');
      const soonest = [...institution].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0];

      // Find matching config
      const config = configMap.get(normalized);
      const minimumNeed = config ? config.minimumInstitutionNeed : 1;

      if (config) {
        processedIds.add(config.id);
        await this.prisma.teamRequirement.update({
          where: { id: config.id },
          data: {
            division, // Update division/team names to match active interns (fixing typos/casing!)
            team,
            leader: groupInterns[0]?.leader || config.leader || '',
            activeInstitutionCount: institution.length,
            activeProfessionalCount: professional.length,
            soonestEndDate: soonest?.endDate ?? null,
            endingInternName: soonest?.name ?? null,
            replacementStatus: evaluateReplacementStatus({
              activeInstitutionCount: institution.length,
              soonestEndDate: soonest?.endDate ?? null,
              replacementCandidate: config.replacementCandidate,
              minimumInstitutionNeed: minimumNeed,
            }),
          },
        });
      } else {
        await this.prisma.teamRequirement.create({
          data: {
            division,
            team,
            leader: groupInterns[0]?.leader || '',
            activeInstitutionCount: institution.length,
            activeProfessionalCount: professional.length,
            soonestEndDate: soonest?.endDate ?? null,
            endingInternName: soonest?.name ?? null,
            minimumInstitutionNeed: 1,
            replacementStatus: evaluateReplacementStatus({
              activeInstitutionCount: institution.length,
              soonestEndDate: soonest?.endDate ?? null,
              replacementCandidate: null,
              minimumInstitutionNeed: 1,
            }),
          },
        });
      }
    }

    // 3. For remaining configs (which have 0 active interns), evaluate status or delete if default/unused
    for (const config of configs) {
      if (!processedIds.has(config.id)) {
        const hasCustomConfig = config.minimumInstitutionNeed > 1 || Boolean(config.replacementCandidate?.trim()) || Boolean(config.notes?.trim());
        if (!hasCustomConfig) {
          await this.prisma.teamRequirement.delete({
            where: { id: config.id },
          });
        } else {
          await this.prisma.teamRequirement.update({
            where: { id: config.id },
            data: {
              replacementStatus: evaluateReplacementStatus({
                activeInstitutionCount: 0,
                soonestEndDate: null,
                replacementCandidate: config.replacementCandidate,
                minimumInstitutionNeed: config.minimumInstitutionNeed,
              }),
            },
          });
        }
      }
    }
  }
}
