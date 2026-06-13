import { format } from 'date-fns';
import { z } from 'zod';
import type { AnalyticsParams } from '@/shared/types/api';

/**
 * Analytics date-range helpers.
 *
 * The selected range lives in the URL (TanStack Router search params) so it is
 * shareable and survives reloads/back-navigation. We store concrete ISO
 * `YYYY-MM-DD` dates rather than GA relative keywords ("7daysAgo") so the
 * custom date pickers always show real dates and the URL is unambiguous — GA
 * accepts ISO dates just the same.
 *
 * Default range is the **last 7 days → today**: GA has processing latency on the
 * current day, so a today-only default would open on an empty dashboard even
 * when recent days have data. The user can narrow to "today" (or anything else)
 * via the preset chips or custom pickers.
 */

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Number of days the dashboard spans by default (last N days, inclusive). */
const DEFAULT_RANGE_DAYS = 7;

/** Local-timezone `YYYY-MM-DD` for today. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Local-timezone `YYYY-MM-DD` for `n` days before today (n=0 → today). */
export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return format(d, 'yyyy-MM-dd');
}

export const PRESET_KEYS = ['today', '7d', '30d', '90d'] as const;
export type PresetKey = (typeof PRESET_KEYS)[number];

/** Concrete `{ startDate, endDate }` for a preset, anchored on today. */
export function presetRange(key: PresetKey): AnalyticsParams {
  const endDate = todayIso();
  switch (key) {
    case 'today':
      return { startDate: endDate, endDate };
    case '7d':
      return { startDate: isoDaysAgo(6), endDate };
    case '30d':
      return { startDate: isoDaysAgo(29), endDate };
    case '90d':
      return { startDate: isoDaysAgo(89), endDate };
  }
}

/** Add `delta` days to an ISO `YYYY-MM-DD` date (negative to subtract). */
export function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return format(date, 'yyyy-MM-dd');
}

/** Inclusive day-count of a range (e.g. today→today = 1). */
export function rangeSpanDays(range: AnalyticsParams): number {
  const start = new Date(`${range.startDate}T00:00:00`);
  const end = new Date(`${range.endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return diff >= 0 ? diff + 1 : 1;
}

/**
 * Widen a range so it always spans at least `minDays`, anchored on its end date.
 * The daily trend needs several points to read as a trend — a single-day range
 * (the "today" default) would otherwise render as one lonely bar. The KPI cards
 * still use the user's exact range; only the trend chart uses this expansion.
 */
export function expandRangeToMinDays(range: AnalyticsParams, minDays = 7): AnalyticsParams {
  if (rangeSpanDays(range) >= minDays) return range;
  return { startDate: addDaysIso(range.endDate, -(minDays - 1)), endDate: range.endDate };
}

/** Which preset (if any) the current range matches — for highlighting chips. */
export function detectPreset(range: AnalyticsParams): PresetKey | null {
  return (
    PRESET_KEYS.find((key) => {
      const r = presetRange(key);
      return r.startDate === range.startDate && r.endDate === range.endDate;
    }) ?? null
  );
}

/**
 * Zod schema for the analytics route's search params. Defaults to the last
 * 7 days (start) through today (end), recomputed on each parse so the range
 * stays correct across a midnight rollover. Invalid values fall back to the
 * same defaults rather than throwing.
 */
export const analyticsSearchSchema = z.object({
  startDate: z
    .string()
    .regex(YMD)
    .default(() => isoDaysAgo(DEFAULT_RANGE_DAYS - 1))
    .catch(() => isoDaysAgo(DEFAULT_RANGE_DAYS - 1)),
  endDate: z
    .string()
    .regex(YMD)
    .default(() => todayIso())
    .catch(() => todayIso()),
});

export type AnalyticsSearch = z.infer<typeof analyticsSearchSchema>;
