import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type {
  AnalyticsEnvelope,
  AnalyticsOverviewRow,
  AnalyticsParams,
  AnalyticsTopPage,
  AnalyticsTrafficSource,
} from '@/shared/types/api';

/**
 * GA4 analytics proxy — three read-only endpoints sharing the same
 * `{ startDate, endDate }` query. The admin token is attached by the shared
 * axios request interceptor. Each response nests its payload twice
 * (`response.data` = envelope, `envelope.data.rows` = the rows we render), and
 * each helper unwraps straight to `rows`.
 *
 * On a GA/quota/network failure these endpoints return HTTP 500, which the
 * axios response interceptor turns into an `ApiError` — handled per-widget in
 * the page via `QueryErrorState`.
 */

export async function fetchAnalyticsOverview(
  params: AnalyticsParams
): Promise<AnalyticsOverviewRow[]> {
  const { data } = await api.get<ApiResponse<AnalyticsEnvelope<AnalyticsOverviewRow>>>(
    '/analytics/overview',
    { params }
  );
  return data.data.rows;
}

export async function fetchAnalyticsTopPages(
  params: AnalyticsParams
): Promise<AnalyticsTopPage[]> {
  const { data } = await api.get<ApiResponse<AnalyticsEnvelope<AnalyticsTopPage>>>(
    '/analytics/top-pages',
    { params }
  );
  return data.data.rows;
}

export async function fetchAnalyticsTrafficSources(
  params: AnalyticsParams
): Promise<AnalyticsTrafficSource[]> {
  const { data } = await api.get<ApiResponse<AnalyticsEnvelope<AnalyticsTrafficSource>>>(
    '/analytics/traffic-sources',
    { params }
  );
  return data.data.rows;
}
