import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  analyticsSearchSchema,
  detectPreset,
  expandRangeToMinDays,
  isoDaysAgo,
  presetRange,
  rangeSpanDays,
  todayIso,
} from './range';

describe('analytics range', () => {
  it('presetRange("today") is today → today', () => {
    const r = presetRange('today');
    expect(r.startDate).toBe(todayIso());
    expect(r.endDate).toBe(todayIso());
  });

  it('presetRange("7d") spans 7 inclusive days ending today', () => {
    const r = presetRange('7d');
    expect(r.endDate).toBe(todayIso());
    expect(r.startDate).toBe(isoDaysAgo(6));
  });

  it('detectPreset round-trips a known preset and returns null for custom', () => {
    expect(detectPreset(presetRange('30d'))).toBe('30d');
    expect(detectPreset({ startDate: '2020-01-01', endDate: '2020-01-15' })).toBeNull();
  });

  it('search schema defaults missing dates to today', () => {
    const parsed = analyticsSearchSchema.parse({});
    expect(parsed.startDate).toBe(todayIso());
    expect(parsed.endDate).toBe(todayIso());
  });

  it('search schema falls back to today for malformed dates', () => {
    const parsed = analyticsSearchSchema.parse({ startDate: 'garbage', endDate: '2026-06-13' });
    expect(parsed.startDate).toBe(todayIso());
    expect(parsed.endDate).toBe('2026-06-13');
  });

  it('addDaysIso subtracts/adds calendar days without timezone drift', () => {
    expect(addDaysIso('2026-06-13', -6)).toBe('2026-06-07');
    expect(addDaysIso('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('rangeSpanDays counts inclusive days', () => {
    expect(rangeSpanDays({ startDate: '2026-06-13', endDate: '2026-06-13' })).toBe(1);
    expect(rangeSpanDays({ startDate: '2026-06-07', endDate: '2026-06-13' })).toBe(7);
  });

  it('expandRangeToMinDays widens a single day to a 7-day window, anchored on end', () => {
    const widened = expandRangeToMinDays({ startDate: '2026-06-13', endDate: '2026-06-13' });
    expect(widened).toEqual({ startDate: '2026-06-07', endDate: '2026-06-13' });
  });

  it('expandRangeToMinDays leaves already-wide ranges untouched', () => {
    const range = { startDate: '2026-05-15', endDate: '2026-06-13' };
    expect(expandRangeToMinDays(range)).toBe(range);
  });
});
