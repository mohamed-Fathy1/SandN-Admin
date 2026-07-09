import { beforeAll, describe, expect, it } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import i18n from '@/i18n';
import { server } from '@/test/mocks/server';
import { renderHookWithQuery } from '@/test/utils';
import { getBreakdownRows, getMetricValue } from '../lib/clarity';
import { useClarityInsights } from './use-clarity';

const API = 'https://api.test.local';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('useClarityInsights', () => {
  it('fetches the payload with the requested dimension and unwraps the envelope', async () => {
    const { result } = renderHookWithQuery(() => useClarityInsights('Device'));
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    const data = result.current.query.data;
    expect(data?.remainingLiveCalls).toBe(9);
    expect(getMetricValue(data, 'Traffic', 'totalSessionCount')).toBe(128);
    // The requested dimension always yields a breakdown block.
    expect(getBreakdownRows(data).length).toBeGreaterThan(0);
  });

  it('requests the breakdown block for the passed dimension', async () => {
    const { result } = renderHookWithQuery(() => useClarityInsights('Browser'));
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    const rows = getBreakdownRows(result.current.query.data);
    expect(rows[0].name).toBe('Chrome');
  });

  it('does not send refresh=true on the initial query', async () => {
    let refreshParam: string | null = 'unset';
    server.use(
      http.get(`${API}/analytics/clarity`, ({ request }) => {
        refreshParam = new URL(request.url).searchParams.get('refresh');
        return HttpResponse.json({
          statusCode: 200,
          data: {
            dimension1: null,
            fetchedAt: '2026-07-09T12:00:00.000Z',
            fromCache: true,
            stale: false,
            liveCallsToday: 1,
            remainingLiveCalls: 9,
            note: null,
            metrics: [{ metricName: 'Traffic', information: [{ totalSessionCount: '1' }] }],
          },
          message: 'Success',
          success: true,
        });
      })
    );

    const { result } = renderHookWithQuery(() => useClarityInsights('Device'));
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(refreshParam).toBeNull();
  });

  it('sends refresh=true only when the refresh mutation runs and writes it back to cache', async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get(`${API}/analytics/clarity`, ({ request }) => {
        const refresh = new URL(request.url).searchParams.get('refresh');
        seen.push(refresh);
        return HttpResponse.json({
          statusCode: 200,
          data: {
            dimension1: null,
            fetchedAt: '2026-07-09T12:00:00.000Z',
            fromCache: refresh !== 'true',
            stale: false,
            liveCallsToday: refresh === 'true' ? 2 : 1,
            remainingLiveCalls: refresh === 'true' ? 8 : 9,
            note: null,
            metrics: [{ metricName: 'Traffic', information: [{ totalSessionCount: '1' }] }],
          },
          message: 'Success',
          success: true,
        });
      })
    );

    const { result } = renderHookWithQuery(() => useClarityInsights('Device'));
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.query.data?.remainingLiveCalls).toBe(9);

    await act(async () => {
      await result.current.refresh.mutateAsync();
    });

    expect(seen).toContain('true');
    // The refreshed payload is written straight into the query cache.
    await waitFor(() => expect(result.current.query.data?.remainingLiveCalls).toBe(8));
  });
});
