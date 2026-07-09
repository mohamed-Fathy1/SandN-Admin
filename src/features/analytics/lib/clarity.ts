import type { ClarityDimension, ClarityInsights, ClarityMetric } from '@/shared/types/api';

/**
 * Microsoft Clarity data helpers.
 *
 * Clarity returns every number as a **string** (or `null` when unavailable) and
 * ships a heterogeneous `metrics` array — scalar quality metrics, a few headline
 * blocks (Traffic / ScrollDepth / EngagementTime), and an optional dimension
 * breakdown. These helpers parse the strings, pull a named block out of the
 * array, and distinguish "no data" (null) from a real zero so the UI can render
 * `—` instead of a misleading `0`.
 */

/** Breakdown dimensions offered in the selector, in menu order. */
export const CLARITY_DIMENSIONS = [
  'Browser',
  'Device',
  'OS',
  'Country',
  'Source',
  'Medium',
  'Campaign',
  'Channel',
  'URL',
  'Referrer',
] as const satisfies readonly ClarityDimension[];

/**
 * Behaviour/quality metric names, in display order. Each carries a single info
 * row with `sessionsWithMetricPercentage` — the share of sessions where the
 * friction happened (lower is better).
 */
export const CLARITY_BEHAVIOUR_METRICS = [
  'DeadClickCount',
  'RageClickCount',
  'QuickbackClick',
  'ExcessiveScroll',
  'ScriptErrorCount',
  'ErrorClickCount',
] as const;

export type ClarityBehaviourMetric = (typeof CLARITY_BEHAVIOUR_METRICS)[number];

/** Metric names that carry scalar (single-row) data, not a dimension breakdown. */
const SCALAR_METRIC_NAMES = new Set<string>([
  ...CLARITY_BEHAVIOUR_METRICS,
  'Traffic',
  'ScrollDepth',
  'EngagementTime',
]);

/** Parse Clarity's string/number/null cell into a `number | null` (never NaN). */
export function parseClarityNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Find a metric block by name. */
export function getMetric(
  insights: ClarityInsights | undefined,
  name: string
): ClarityMetric | undefined {
  return insights?.metrics.find((m) => m.metricName === name);
}

/** First `information` row of a named metric block, or `undefined`. */
export function getMetricRow(
  insights: ClarityInsights | undefined,
  name: string
): Record<string, string | number | null> | undefined {
  return getMetric(insights, name)?.information[0];
}

/** Parse a single field off a named metric's first row. */
export function getMetricValue(
  insights: ClarityInsights | undefined,
  name: string,
  field: string
): number | null {
  return parseClarityNumber(getMetricRow(insights, name)?.[field]);
}

/** Headline traffic numbers, all parsed. */
export function getTrafficTotals(insights: ClarityInsights | undefined) {
  const sessions = getMetricValue(insights, 'Traffic', 'totalSessionCount');
  const bots = getMetricValue(insights, 'Traffic', 'totalBotSessionCount');
  const users = getMetricValue(insights, 'Traffic', 'distinctUserCount');
  const pagesPerSession = getMetricValue(insights, 'Traffic', 'pagesPerSessionPercentage');
  const botPercent = sessions && sessions > 0 && bots != null ? (bots / sessions) * 100 : null;
  return { sessions, bots, users, pagesPerSession, botPercent };
}

/** One breakdown row after parsing (`name` + `sessionsCount`). */
export interface ClarityBreakdownRow {
  name: string;
  sessions: number;
}

/**
 * The dimension breakdown rows for the requested dimension, sorted by sessions
 * (busiest first). Clarity labels the breakdown block inconsistently
 * (`Browser`, `ReferrerUrl`, `PopularPages`, …), so rather than guessing the
 * exact name we pick the first non-scalar block whose rows carry a `name` field.
 */
export function getBreakdownRows(insights: ClarityInsights | undefined): ClarityBreakdownRow[] {
  const block = insights?.metrics.find(
    (m) =>
      !SCALAR_METRIC_NAMES.has(m.metricName) &&
      m.information.length > 0 &&
      m.information[0]?.name != null
  );
  if (!block) return [];
  return block.information
    .map((row) => ({
      name: String(row.name ?? '—'),
      sessions: parseClarityNumber(row.sessionsCount) ?? 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

/**
 * True when the payload has no meaningful activity — no traffic and every
 * behaviour metric empty/zero. Drives the "not enough data" empty state.
 */
export function isClarityEmpty(insights: ClarityInsights | undefined): boolean {
  if (!insights) return true;
  const sessions = getMetricValue(insights, 'Traffic', 'totalSessionCount');
  if (sessions && sessions > 0) return false;
  const anyBehaviour = CLARITY_BEHAVIOUR_METRICS.some(
    (name) => (getMetricValue(insights, name, 'sessionsCount') ?? 0) > 0
  );
  return !anyBehaviour;
}
