import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { QUERY_STALE_TIME } from '@/config/constants';
import type { AnalyticsParams } from '@/shared/types/api';
import {
  fetchAnalyticsOverview,
  fetchAnalyticsTopPages,
  fetchAnalyticsTrafficSources,
} from '../api/analytics';

/**
 * GA4 analytics queries. Read-only — there are no mutations to invalidate, so a
 * manual refresh just calls `refetch()`. Each query is keyed by the date range,
 * so toggling back to a previously viewed range serves cached data instead of
 * refetching (`staleTime: default`).
 *
 * The three queries are exposed individually (and bundled via `useAnalytics`)
 * so each widget renders its own loading/error state — a GA failure on one
 * endpoint never blanks the whole page.
 */

export function useAnalyticsOverview(params: AnalyticsParams) {
  return useQuery({
    queryKey: adminQueryKeys.analytics.overview(params),
    queryFn: () => fetchAnalyticsOverview(params),
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useAnalyticsTopPages(params: AnalyticsParams) {
  return useQuery({
    queryKey: adminQueryKeys.analytics.topPages(params),
    queryFn: () => fetchAnalyticsTopPages(params),
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useAnalyticsTrafficSources(params: AnalyticsParams) {
  return useQuery({
    queryKey: adminQueryKeys.analytics.trafficSources(params),
    queryFn: () => fetchAnalyticsTrafficSources(params),
    staleTime: QUERY_STALE_TIME.default,
  });
}

/** Fires all three analytics queries in parallel for a given range. */
export function useAnalytics(params: AnalyticsParams) {
  const overview = useAnalyticsOverview(params);
  const topPages = useAnalyticsTopPages(params);
  const trafficSources = useAnalyticsTrafficSources(params);
  return { overview, topPages, trafficSources };
}
