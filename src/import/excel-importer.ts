import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { excelSerialToDate, formatDuration } from '../domain/internship.logic.js';

type Row = Record<string, unknown>;

const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const monthMap = new Map(monthNames.map((name, index) => [name, index + 1]));

const clean = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

const dateFromExcel = (value: unknown): Date | null => {
  if (typeof value === 'number') return new Date(`${excelSerialToDate(value)}T00:00:00.000Z`);
  const text = clean(value);
  if (!text || /^[a-z]+$/i.test(text)) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const money = (value: unknown): number => {
  if (typeof value === 'number') return Math.round(value);
  const parsed = Number(clean(value).replace(/[^\d-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const yearValue = (value: unknown): number | null => {
  const parsed = Number(clean(value));
  return Number.isInteger(parsed) && parsed >= 2020 && parsed <= 2035 ? parsed : null;
};

const rows = (workbook: XLSX.WorkBook, sheetName: string, range = 0): Row[] => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: '', range });
};

const matrix = (workbook: XLSX.WorkBook, sheetName: string): unknown[][] => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
};

export function extractMonthlyCostValues(
  raw: unknown[][],
  rowIndex: number,
  type: 'INSTITUTION' | 'PROFESSIONAL',
): { month: number; year: number; value: number }[] {
  const row = raw[rowIndex] ?? [];
  const yearHeader = raw[type === 'INSTITUTION' ? 0 : 0] ?? [];
  const monthHeader = raw[type === 'INSTITUTION' ? 1 : 1] ?? [];
  let activeYear = 2026;
  const values: { month: number; year: number; value: number }[] = [];

  for (let column = 0; column < row.length; column += 1) {
    activeYear = yearValue(yearHeader[column]) ?? activeYear;
    const month = monthMap.get(clean(monthHeader[column]).toUpperCase());
    if (!month) continue;

    const value = money(row[column]);
    if (value > 0) {
      values.push({ month, year: activeYear, value });
    }
  }

  return values;
}

export function buildMonthlyCostPayload(
  type: 'INSTITUTION' | 'PROFESSIONAL',
  month: number,
  year: number,
  value: number,
) {
  const attendanceDays = type === 'INSTITUTION' ? Math.round(value / 25000) : 0;
  const workingDays = type === 'INSTITUTION' ? attendanceDays : 22;

  return {
    month,
    year,
    baseSalary: type === 'PROFESSIONAL' ? value : 0,
    mealAllowancePerDay: type === 'INSTITUTION' ? 25000 : 0,
    workingDays,
    attendanceDays,
    totalMealAllowance: type === 'INSTITUTION' ? value : 0,
    totalMonthlyCost: value,
  };
}

export async function importWorkbook(path: string, prisma: PrismaClient) {
  const workbook = XLSX.readFile(path, { cellDates: false });
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'staff@company.test' },
    create: { name: 'HCM Staff', email: 'staff@company.test', passwordHash, role: 'HCM_STAFF' },
    update: {},
  });
  await prisma.user.upsert({
    where: { email: 'leader@company.test' },
    create: {
      name: 'HCM Leader',
      email: 'leader@company.test',
      passwordHash,
      role: 'HCM_LEADER',
      division: 'CORE',
      team: 'HCM',
    },
    update: {},
  });

  const counters = {
    institutionInterns: await importInterns(prisma, workbook, 'Lifetime MaInst (Persiswa)', 'INSTITUTION'),
    professionalInterns: await importInterns(prisma, workbook, 'Lifetime MaPro (Per-anggota)', 'PROFESSIONAL'),
    plans: await importPlans(prisma, workbook),
    replacement: await importReplacement(prisma, workbook),
    evaluations: await importEvaluations(prisma, workbook),
  };

  return { message: 'Import Excel selesai.', counters };
}

async function importInterns(
  prisma: PrismaClient,
  workbook: XLSX.WorkBook,
  sheetName: string,
  type: 'INSTITUTION' | 'PROFESSIONAL',
) {
  const raw = matrix(workbook, sheetName);
  const headerIndex = type === 'INSTITUTION' ? 0 : 1;
  const startIndex = type === 'INSTITUTION' ? 3 : 3;
  const headers = (raw[headerIndex] ?? []).map((value) => clean(value));
  let imported = 0;
  for (let rowIndex = startIndex; rowIndex < raw.length; rowIndex += 1) {
    const line = raw[rowIndex] ?? [];
    const row = Object.fromEntries(headers.map((header, index) => [header, line[index] ?? '']));
    const name = clean(row.Nama);
    const startDate = dateFromExcel(row['Join Date']);
    const endDate = dateFromExcel(row['End Date']);
    const division = clean(row.Divisi);
    const team = clean(row['Sub-Divisi / Bagian'] ?? row['Sub- Divisi']);
    if (!name || !startDate || !endDate || !division) continue;

    const intern = await prisma.intern.upsert({
      where: {
        name_type_startDate_endDate: {
          name,
          type,
          startDate,
          endDate,
        },
      },
      create: {
        name,
        type,
        institution: clean(row.Instansi),
        major: '',
        division,
        team: team || '-',
        position: clean(row.Posisi),
        leader: clean(row['Leader / PIC'] ?? row.Leader),
        location: clean(row.Lokasi),
        startDate,
        endDate,
        durationLabel: formatDuration(startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)),
        manualStatus: clean(row.Status).toLowerCase() === 'terminated' ? 'TERMINATED' : null,
        sourceSheet: sheetName,
      },
      update: {
        institution: clean(row.Instansi),
        division,
        team: team || '-',
        position: clean(row.Posisi),
        leader: clean(row['Leader / PIC'] ?? row.Leader),
        location: clean(row.Lokasi),
        manualStatus: clean(row.Status).toLowerCase() === 'terminated' ? 'TERMINATED' : null,
      },
    });

    await prisma.completionChecklist.upsert({
      where: { internId: intern.id },
      create: { internId: intern.id },
      update: {},
    });

    await importMonthlyCosts(prisma, intern.id, type, extractMonthlyCostValues(raw, rowIndex, type));
    imported += 1;
  }
  return imported;
}

async function importMonthlyCosts(
  prisma: PrismaClient,
  internId: string,
  type: 'INSTITUTION' | 'PROFESSIONAL',
  monthlyCosts: { month: number; year: number; value: number }[],
) {
  for (const monthlyCost of monthlyCosts) {
    const { month, year, value } = monthlyCost;
    const payload = buildMonthlyCostPayload(type, month, year, value);
    await prisma.monthlyCost.upsert({
      where: { internId_month_year: { internId, month, year } },
      create: {
        internId,
        ...payload,
      },
      update: {
        ...payload,
      },
    });
  }
}

async function importPlans(prisma: PrismaClient, workbook: XLSX.WorkBook) {
  const raw = matrix(workbook, 'Rencana Magang ');
  const headers = (raw[2] ?? []).map((value) => clean(value));
  const data = raw.slice(4).map((line) =>
    Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ''])),
  );
  let imported = 0;
  for (const row of data) {
    const name = clean(row['Nama '] ?? row.Nama);
    const startDate = dateFromExcel(row['Tgl. Masuk']);
    const endDate = dateFromExcel(row['Tgl. Selesai']);
    if (!name || !startDate || !endDate) continue;
    await prisma.internshipPlan.upsert({
      where: {
        name_type_plannedStartDate: {
          name,
          type: clean(row['Magang Type']).toLowerCase().includes('prof') ? 'PROFESSIONAL' : 'INSTITUTION',
          plannedStartDate: startDate,
        },
      },
      create: {
        name,
        type: clean(row['Magang Type']).toLowerCase().includes('prof') ? 'PROFESSIONAL' : 'INSTITUTION',
        institution: clean(row['Asal Instansi']),
        major: clean(row.Jurusan),
        targetDivision: clean(row.Divisi) || '-',
        targetTeam: clean(row.Tim) || '-',
        leader: clean(row.Tim),
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        phone: clean(row['No Handphone']),
        processStatus: clean(row['Selesai Magang']) ? 'COMPLETED' : 'WAITING_JOIN',
        sourceSheet: 'Rencana Magang ',
      },
      update: {
        institution: clean(row['Asal Instansi']),
        major: clean(row.Jurusan),
        targetDivision: clean(row.Divisi) || '-',
        targetTeam: clean(row.Tim) || '-',
        phone: clean(row['No Handphone']),
      },
    });
    imported += 1;
  }
  return imported;
}

async function importReplacement(prisma: PrismaClient, workbook: XLSX.WorkBook) {
  const data = rows(workbook, 'Lifetime Pergantian Magang ', 1);
  let imported = 0;
  for (const row of data) {
    const division = clean(row.Divisi);
    const team = clean(row.Team);
    if (!division || !team) continue;
    await prisma.teamRequirement.upsert({
      where: { division_team: { division, team } },
      create: {
        division,
        team,
        leader: '',
        minimumInstitutionNeed: 1,
        notes: clean(row.Position),
        sourceSheet: 'Lifetime Pergantian Magang ',
      },
      update: {
        notes: clean(row.Position),
        sourceSheet: 'Lifetime Pergantian Magang ',
      },
    });
    imported += 1;
  }
  return imported;
}

async function importEvaluations(prisma: PrismaClient, workbook: XLSX.WorkBook) {
  const data = rows(workbook, 'Profiling Magang QA');
  let imported = 0;
  for (const row of data) {
    const name = clean(row.Nama);
    if (!name) continue;
    const intern = await prisma.intern.findFirst({ where: { name: { contains: name, mode: 'insensitive' } } });
    if (!intern) continue;
    await prisma.leaderEvaluation.create({
      data: {
        internId: intern.id,
        score: money(row['PENILAIAN TIM SQ\n(ON TEAM PROJECT)']) || null,
        notes: clean(row['KELUHAN / KENDALA']),
        evidence: clean(row['Evidence Self Learning']),
      },
    });
    imported += 1;
  }
  return imported;
}
