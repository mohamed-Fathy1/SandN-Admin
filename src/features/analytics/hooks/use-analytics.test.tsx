import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils';
import {
  useAnalyticsOverview,
  useAnalyticsTopPages,
  useAnalyticsTrafficSources,
} from './use-analytics';

const range = { startDate: '2026-06-12', endDate: '2026-06-13' };

describe('analytics hooks', () => {
  it('unwraps overview rows from the double envelope', async () => {
    const { result } = renderHookWithQuery(() => useAnalyticsOverview(range));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[1].date).toBe('2026-06-13');
    expect(result.current.data?.[1].activeUsers).toBe(3);
  });

  it('returns top pages busiest first', async () => {
    const { result } = renderHookWithQuery(() => useAnalyticsTopPages(range));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].pagePath).toBe('/');
    expect(result.current.data?.[0].screenPageViews).toBe(5);
  });

  it('returns traffic sources including GA special buckets', async () => {
    const { result } = renderHookWithQuery(() => useAnalyticsTrafficSources(range));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.map((r) => r.source)).toContain('(direct)');
  });
});
