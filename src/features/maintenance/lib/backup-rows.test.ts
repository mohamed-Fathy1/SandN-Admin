import { describe, expect, it } from 'vitest';
import { buildBackupRows, countMissingDays, utcDay } from './backup-rows';
import type { BackupItem } from '@/shared/types/api';

function backup(createdAt: string): BackupItem {
  const key = `mongo/backup-${createdAt}.gz`;
  return { fileName: `backup-${createdAt}.gz`, key, createdAt, sizeBytes: 1024, size: '1 KB' };
}

describe('utcDay', () => {
  it('takes the UTC calendar day from an ISO timestamp regardless of local tz', () => {
    expect(utcDay('2026-06-08T04:38:00.000Z')).toBe('2026-06-08');
    // Late-UTC time still belongs to that UTC day, not the next local one.
    expect(utcDay('2026-06-08T23:59:59.000Z')).toBe('2026-06-08');
  });
});

describe('buildBackupRows', () => {
  it('returns no rows for an empty list', () => {
    expect(buildBackupRows([])).toEqual([]);
  });

  it('emits a single backup row with no gaps', () => {
    const rows = buildBackupRows([backup('2026-06-08T04:38:00.000Z')]);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('backup');
    expect(countMissingDays(rows)).toBe(0);
  });

  it('keeps rows newest-first and inserts missing markers for skipped days', () => {
    // 08th present, 07th MISSING, 06th present.
    const rows = buildBackupRows([
      backup('2026-06-06T04:00:00.000Z'),
      backup('2026-06-08T04:00:00.000Z'),
    ]);
    expect(rows.map((r) => [r.kind, r.utcDay])).toEqual([
      ['backup', '2026-06-08'],
      ['missing', '2026-06-07'],
      ['backup', '2026-06-06'],
    ]);
    expect(countMissingDays(rows)).toBe(1);
  });

  it('flags multiple consecutive missing days', () => {
    const rows = buildBackupRows([
      backup('2026-06-01T04:00:00.000Z'),
      backup('2026-06-05T04:00:00.000Z'),
    ]);
    expect(countMissingDays(rows)).toBe(3); // 02, 03, 04
    expect(rows[0].utcDay).toBe('2026-06-05');
    expect(rows[rows.length - 1].utcDay).toBe('2026-06-01');
  });

  it('does not treat multiple backups on the same day as a gap', () => {
    const rows = buildBackupRows([
      backup('2026-06-08T04:00:00.000Z'),
      backup('2026-06-08T16:00:00.000Z'),
    ]);
    expect(countMissingDays(rows)).toBe(0);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.kind === 'backup')).toBe(true);
  });

  it('sorts unordered input before building rows', () => {
    const rows = buildBackupRows([
      backup('2026-06-06T04:00:00.000Z'),
      backup('2026-06-08T04:00:00.000Z'),
      backup('2026-06-07T04:00:00.000Z'),
    ]);
    expect(rows.map((r) => r.utcDay)).toEqual(['2026-06-08', '2026-06-07', '2026-06-06']);
    expect(countMissingDays(rows)).toBe(0);
  });

  it('handles a month boundary', () => {
    const rows = buildBackupRows([
      backup('2026-05-30T04:00:00.000Z'),
      backup('2026-06-01T04:00:00.000Z'),
    ]);
    expect(rows.map((r) => [r.kind, r.utcDay])).toEqual([
      ['backup', '2026-06-01'],
      ['missing', '2026-05-31'],
      ['backup', '2026-05-30'],
    ]);
  });
});
