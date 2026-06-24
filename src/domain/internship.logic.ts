export type InternshipType = 'INSTITUTION' | 'PROFESSIONAL';
export type InternshipStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
export type ReplacementStatus = 'COVERED' | 'NEEDS_REPLACEMENT' | 'URGENT_EMPTY';
export type NotificationType =
  | 'ENDING_SOON'
  | 'TEAM_EMPTY'
  | 'COMPLETION_INCOMPLETE'
  | 'ACCEPTANCE_LETTER_PENDING'
  | 'PLAN_STARTING_SOON';

export interface MonthlyCostInput {
  type: InternshipType;
  baseSalary: number;
  mealAllowancePerDay: number;
  workingDays: number;
  attendanceDays: number;
}

export interface ReplacementInput {
  activeInstitutionCount: number;
  soonestEndDate: Date | string | null;
  replacementCandidate: string | null;
  minimumInstitutionNeed: number;
  today?: Date;
}

export interface NotificationIntern {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: InternshipStatus;
  type: InternshipType;
  division: string;
  team: string;
  acceptanceLetterSent: boolean;
  completionComplete: boolean;
}

export interface NotificationTeamRequirement {
  id: string;
  division: string;
  team: string;
  activeInstitutionCount: number;
  activeProfessionalCount: number;
  minimumInstitutionNeed: number;
  soonestEndDate: string | Date | null;
  replacementCandidate: string | null;
}

export interface NotificationItem {
  type: NotificationType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
  sourceId: string;
}

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const toUtcDate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  return new Date(`${value}T00:00:00.000Z`);
};

const daysBetween = (start: Date, end: Date): number => {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / dayMs);
};

export const calculateStatus = (
  startDate: string,
  endDate: string,
  today = new Date(),
  manuallyTerminated = false,
): InternshipStatus => {
  if (manuallyTerminated) return 'TERMINATED';

  const current = toUtcDate(today);
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);

  if (current < start) return 'PLANNED';
  if (current > end) return 'COMPLETED';
  return 'ACTIVE';
};

export const formatDuration = (startDate: string, endDate: string): string => {
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  let day = end.getUTCDate() - start.getUTCDate();

  if (day < 0) {
    months -= 1;
    const previousMonthEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0)).getUTCDate();
    day += previousMonthEnd;
  }

  return `${Math.max(months, 0)} Bulan - ${Math.max(day, 0)} Hari`;
};

export const excelSerialToDate = (serial: number): string => {
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

export const calculateMonthlyCost = (input: MonthlyCostInput) => {
  const attendanceDays = Math.min(Math.max(input.attendanceDays, 0), Math.max(input.workingDays, 0));
  const totalMealAllowance = attendanceDays * Math.max(input.mealAllowancePerDay, 0);
  const baseSalary = input.type === 'PROFESSIONAL' ? Math.max(input.baseSalary, 0) : 0;

  return {
    totalMealAllowance,
    totalMonthlyCost: baseSalary + totalMealAllowance,
  };
};

export const evaluateReplacementStatus = (input: ReplacementInput): ReplacementStatus => {
  if (input.minimumInstitutionNeed > 0 && input.activeInstitutionCount <= 0) return 'URGENT_EMPTY';

  const hasCandidate = Boolean(input.replacementCandidate?.trim());
  if (!hasCandidate && input.soonestEndDate) {
    const today = toUtcDate(input.today ?? new Date());
    const endDate = toUtcDate(input.soonestEndDate);
    if (daysBetween(today, endDate) <= 30 && daysBetween(today, endDate) >= 0) {
      return 'NEEDS_REPLACEMENT';
    }
  }

  return 'COVERED';
};

export const detectNotifications = (input: {
  today?: Date;
  interns: NotificationIntern[];
  teamRequirements: NotificationTeamRequirement[];
}): NotificationItem[] => {
  const today = toUtcDate(input.today ?? new Date());
  const items: NotificationItem[] = [];

  for (const intern of input.interns) {
    const endDate = toUtcDate(intern.endDate);
    const startDate = toUtcDate(intern.startDate);
    const daysToEnd = daysBetween(today, endDate);
    const daysToStart = daysBetween(today, startDate);

    if (intern.status === 'ACTIVE' && daysToEnd >= 0 && daysToEnd <= 30) {
      items.push({
        type: 'ENDING_SOON',
        title: `${intern.name} selesai dalam ${daysToEnd} hari`,
        description: `${intern.division} / ${intern.team}`,
        severity: 'warning',
        sourceId: intern.id,
      });
    }

    if (!intern.acceptanceLetterSent && intern.status === 'PLANNED') {
      items.push({
        type: 'ACCEPTANCE_LETTER_PENDING',
        title: `Surat penerimaan ${intern.name} belum dikirim`,
        description: `${intern.division} / ${intern.team}`,
        severity: 'warning',
        sourceId: intern.id,
      });
    }

    if (intern.status === 'PLANNED' && daysToStart >= 0 && daysToStart <= 7) {
      items.push({
        type: 'PLAN_STARTING_SOON',
        title: `${intern.name} akan mulai dalam ${daysToStart} hari`,
        description: `${intern.division} / ${intern.team}`,
        severity: 'info',
        sourceId: intern.id,
      });
    }

    if (intern.status === 'COMPLETED' && !intern.completionComplete) {
      items.push({
        type: 'COMPLETION_INCOMPLETE',
        title: `Checklist ${intern.name} belum lengkap`,
        description: `${intern.division} / ${intern.team}`,
        severity: 'warning',
        sourceId: intern.id,
      });
    }
  }

  for (const team of input.teamRequirements) {
    if (evaluateReplacementStatus({ ...team, today }) === 'URGENT_EMPTY') {
      items.push({
        type: 'TEAM_EMPTY',
        title: `${team.division} / ${team.team} kosong`,
        description: 'Tidak ada peserta magang instansi aktif.',
        severity: 'danger',
        sourceId: team.id,
      });
    }
  }

  return items;
};
