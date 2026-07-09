import { describe, expect, it } from 'vitest';
import type { ClarityInsights } from '@/shared/types/api';
import {
  getBreakdownRows,
  getMetricValue,
  getTrafficTotals,
  isClarityEmpty,
  parseClarityNumber,
} from './clarity';

function insights(partial: Partial<ClarityInsights>): ClarityInsights {
  return {
    dimension1: null,
    fetchedAt: '2026-07-09T12:00:00.000Z',
    fromCache: true,
    stale: false,
    liveCallsToday: 1,
    remainingLiveCalls: 9,
    note: null,
    metrics: [],
    ...partial,
  };
}

describe('parseClarityNumber', () => {
  it('parses string numbers and passes through numbers', () => {
    expect(parseClarityNumber('128')).toBe(128);
    expect(parseClarityNumber(7)).toBe(7);
    expect(parseClarityNumber('3.5')).toBe(3.5);
  });

  it('returns null for null/undefined/NaN — never 0', () => {
    expect(parseClarityNumber(null)).toBeNull();
    expect(parseClarityNumber(undefined)).toBeNull();
    expect(parseClarityNumber('not-a-number')).toBeNull();
  });
});

describe('getMetricValue', () => {
  it('reads a parsed field off a named metric row', () => {
    const data = insights({
      metrics: [
        { metricName: 'Traffic', information: [{ totalSessionCount: '128' }] },
        { metricName: 'ScrollDepth', information: [{ averageScrollDepth: null }] },
      ],
    });
    expect(getMetricValue(data, 'Traffic', 'totalSessionCount')).toBe(128);
    expect(getMetricValue(data, 'ScrollDepth', 'averageScrollDepth')).toBeNull();
    expect(getMetricValue(data, 'Missing', 'x')).toBeNull();
  });
});

describe('getTrafficTotals', () => {
  it('derives bot percentage from session counts', () => {
    const data = insights({
      metrics: [
        {
          metricName: 'Traffic',
          information: [
            {
              totalSessionCount: '100',
              totalBotSessionCount: '20',
              distinctUserCount: '80',
              pagesPerSessionPercentage: '2.5',
            },
          ],
        },
      ],
    });
    const totals = getTrafficTotals(data);
    expect(totals.sessions).toBe(100);
    expect(totals.users).toBe(80);
    expect(totals.botPercent).toBe(20);
  });

  it('returns null bot percentage when there are no sessions', () => {
    const data = insights({
      metrics: [
        {
          metricName: 'Traffic',
          information: [
            {
              totalSessionCount: '0',
              totalBotSessionCount: '0',
              distinctUserCount: '0',
              pagesPerSessionPercentage: null,
            },
          ],
        },
      ],
    });
    expect(getTrafficTotals(data).botPercent).toBeNull();
  });
});

describe('getBreakdownRows', () => {
  it('sorts the dimension block by sessions, busiest first', () => {
    const data = insights({
      dimension1: 'Browser',
      metrics: [
        { metricName: 'Traffic', information: [{ totalSessionCount: '10' }] },
        {
          metricName: 'Browser',
          information: [
            { name: 'Safari', sessionsCount: '38' },
            { name: 'Chrome', sessionsCount: '74' },
            { name: 'Edge', sessionsCount: '16' },
          ],
        },
      ],
    });
    const rows = getBreakdownRows(data);
    expect(rows.map((r) => r.name)).toEqual(['Chrome', 'Safari', 'Edge']);
    expect(rows[0].sessions).toBe(74);
  });

  it('ignores scalar metrics and returns [] when no breakdown block exists', () => {
    const data = insights({
      metrics: [{ metricName: 'Traffic', information: [{ totalSessionCount: '10' }] }],
    });
    expect(getBreakdownRows(data)).toEqual([]);
  });
});

describe('isClarityEmpty', () => {
  it('is empty when there is no traffic and no behaviour signal', () => {
    const data = insights({
      metrics: [
        { metricName: 'Traffic', information: [{ totalSessionCount: '0' }] },
        { metricName: 'RageClickCount', information: [{ sessionsCount: '0' }] },
      ],
    });
    expect(isClarityEmpty(data)).toBe(true);
  });

  it('is not empty once there is traffic', () => {
    const data = insights({
      metrics: [{ metricName: 'Traffic', information: [{ totalSessionCount: '5' }] }],
    });
    expect(isClarityEmpty(data)).toBe(false);
  });
});
