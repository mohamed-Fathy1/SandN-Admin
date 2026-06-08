import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { QUERY_STALE_TIME } from '@/config/constants';
import { fetchBackupHistory } from '../api/backups';

/**
 * Backup history + health. Read-only, so there are no mutations to invalidate —
 * the page's manual refresh button simply calls `refetch()`.
 */
export function useBackupHistory() {
  return useQuery({
    queryKey: adminQueryKeys.backups.all,
    queryFn: fetchBackupHistory,
    staleTime: QUERY_STALE_TIME.short,
  });
}
