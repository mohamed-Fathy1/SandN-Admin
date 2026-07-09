import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ClarityInsights, ClarityParams } from '@/shared/types/api';

/**
 * Microsoft Clarity behavioural-analytics proxy — a single read endpoint that
 * returns every metric block for the last 3 days in one payload. The admin token
 * is attached by the shared axios request interceptor (this is the store's own
 * JWT, NOT a Clarity token).
 *
 * `dimension1` requests a per-dimension breakdown; omit it for the aggregate.
 * `refresh=true` forces a live Clarity call — Clarity is capped at 10 calls/day,
 * so only send it on an explicit user action while `remainingLiveCalls > 0`.
 *
 * On failure the axios response interceptor turns the error into an `ApiError`
 * carrying the HTTP status (401 → global redirect, 429 → daily limit, 5xx →
 * upstream/network), which the page maps to a friendly state.
 */
export async function fetchClarityInsights(
  params: ClarityParams = {}
): Promise<ClarityInsights> {
  const query: Record<string, string> = {};
  if (params.dimension1) query.dimension1 = params.dimension1;
  if (params.refresh) query.refresh = 'true';

  const { data } = await api.get<ApiResponse<ClarityInsights>>('/analytics/clarity', {
    params: query,
  });
  return data.data;
}
