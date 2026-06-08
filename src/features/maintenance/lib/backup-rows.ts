import type { BackupItem } from '@/shared/types/api';

/**
 * A history row is either a real backup or a `missing` marker standing in for a
 * UTC calendar day, between the oldest and newest backup, on which no backup
 * landed (i.e. that day's scheduled backup failed).
 */
export type BackupRow =
  | { kind: 'backup'; id: string; backup: BackupItem; utcDay: string }
  | { kind: 'missing'; id: string; utcDay: string };

/**
 * Extracts the UTC calendar day (`YYYY-MM-DD`) from an ISO-8601 UTC timestamp.
 * `createdAt` is always UTC, so the leading 10 chars are the day — no timezone
 * conversion needed. Falls back to Date parsing for anything unexpected.
 */
export function utcDay(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
}

function addUtcDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Builds the history rows newest-first, injecting a `missing` marker for every
 * UTC calendar day between the oldest and newest backup that has no backup.
 * Days are compared as `YYYY-MM-DD` strings — lexicographic order equals
 * chronological order for that format.
 */
export function buildBackupRows(backups: BackupItem[]): BackupRow[] {
  if (backups.length === 0) return [];

  // Don't assume server ordering — sort newest-first defensively.
  const sorted = [...backups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const byDay = new Map<string, BackupItem[]>();
  for (const b of sorted) {
    const day = utcDay(b.createdAt);
    const list = byDay.get(day);
    if (list) list.push(b);
    else byDay.set(day, [b]);
  }

  const newestDay = utcDay(sorted[0].createdAt);
  const oldestDay = utcDay(sorted[sorted.length - 1].createdAt);

  const rows: BackupRow[] = [];
  for (let day = newestDay; day >= oldestDay; day = addUtcDays(day, -1)) {
    const dayBackups = byDay.get(day);
    if (dayBackups && dayBackups.length > 0) {
      for (const b of dayBackups) {
        rows.push({ kind: 'backup', id: b.key, backup: b, utcDay: day });
      }
    } else {
      rows.push({ kind: 'missing', id: `missing-${day}`, utcDay: day });
    }
  }
  return rows;
}

/** Count of `missing` marker rows — handy for a "N gaps" summary. */
export function countMissingDays(rows: BackupRow[]): number {
  return rows.reduce((n, r) => (r.kind === 'missing' ? n + 1 : n), 0);
}
