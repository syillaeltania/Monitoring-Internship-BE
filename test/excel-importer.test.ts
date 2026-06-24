import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthlyCostPayload, extractMonthlyCostValues } from '../src/import/excel-importer.ts';

test('extracts institution monthly costs from year and month header rows starting at column M', () => {
  const raw = [
    ['No', 'Nama', 'Instansi', 'Divisi', 'Sub-Divisi / Bagian', 'Leader / PIC', 'Posisi', 'Lokasi', 'Join Date', 'End Date', 'Durasi Magang', 'Lifetime', 'Status', '2024', '', '', '', '', '', '', '', '', '', '', '', '2025'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES', 'JAN'],
    [],
    ['1', 'Syerly', 'Kencana', 'CORE', 'CLC', 'Rangga', 'Admin', 'Bandung', 45516, 45700, '6 bulan', '6 Bulan - 0 Hari', 'Terminated', 700000, 700000, '', '', '', '', '', '', '', '', '', '', 700000],
  ];

  assert.deepEqual(extractMonthlyCostValues(raw, 3, 'INSTITUTION'), [
    { month: 1, year: 2024, value: 700000 },
    { month: 2, year: 2024, value: 700000 },
    { month: 1, year: 2025, value: 700000 },
  ]);
});

test('falls back to 2026 for flat professional month columns', () => {
  const raw = [
    ['Lifetime Magang Professional'],
    ['No', 'Nama', 'Divisi', 'Sub- Divisi', 'Leader', 'Instansi', 'Posisi', 'Status', 'Kontrak ke-', 'Join Date', 'End Date', 'Lifetime', 'JAN', 'FEB'],
    [],
    ['1', 'Giar', 'CORE', 'LOG', 'Soleh', 'SMKN 4 Bandung', 'Log', 'Active', '3', 45838, 46386, '0 Tahun 11 Bulan', 1800000, 2000000],
  ];

  assert.deepEqual(extractMonthlyCostValues(raw, 3, 'PROFESSIONAL'), [
    { month: 1, year: 2026, value: 1800000 },
    { month: 2, year: 2026, value: 2000000 },
  ]);
});

test('keeps historical institution cost value from Excel without capping to 22 working days', () => {
  assert.deepEqual(buildMonthlyCostPayload('INSTITUTION', 1, 2024, 700000), {
    month: 1,
    year: 2024,
    baseSalary: 0,
    mealAllowancePerDay: 25000,
    workingDays: 28,
    attendanceDays: 28,
    totalMealAllowance: 700000,
    totalMonthlyCost: 700000,
  });
});
