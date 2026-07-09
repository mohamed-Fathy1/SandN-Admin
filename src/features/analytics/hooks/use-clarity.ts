import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import type { ClarityDimension } from '@/shared/types/api';
import { fetchClarityInsights } from '../api/clarity';

/**
 * Microsoft Clarity behavioural insights.
 *
 * Read-only and deliberately conservative about network calls: Clarity is capped
 * at 10 live calls/day and the server caches results ~6h, so the query
 * **never auto-refreshes** — no refetch on mount, focus, or reconnect, a long
 * stale time, and no retry storm on a rate-limit error. The headline metrics are
 * dimension-independent and come back in the same payload as the breakdown, so a
 * single query serves the whole panel; `keepPreviousData` holds the last render
 * while switching dimensions so the KPIs never flash a skeleton.
 *
 * A live refresh is a separate, explicit mutation (`refresh`) — it sends
 * `refresh=true` once and writes the result back into the query cache. Callers
 * must gate it on `remainingLiveCalls > 0`.
 */
export function useClarityInsights(dimension: ClarityDimension) {
  const qc = useQueryClient();
  const { t } = useTranslation('analytics');
  const queryKey = adminQueryKeys.analytics.clarity(dimension);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchClarityInsights({ dimension1: dimension }),
    staleTime: QUERY_STALE_TIME.long,
    gcTime: QUERY_STALE_TIME.long,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    placeholderData: keepPreviousData,
  });

  const refresh = useMutation({
    mutationFn: () => fetchClarityInsights({ dimension1: dimension, refresh: true }),
    onSuccess: (data) => {
      qc.setQueryData(queryKey, data);
      toast.success(
        data.stale ? t('clarity.toast.refreshStale') : t('clarity.toast.refreshOk')
      );
    },
    onError: (err) => {
      const status = err instanceof ApiError ? err.statusCode : undefined;
      if (status === 429) toast.error(t('clarity.toast.rateLimited'));
      else toast.error(err instanceof ApiError ? err.message : t('clarity.toast.refreshFail'));
    },
  });

  return { query, refresh };
}
