import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { QUERY_STALE_TIME } from '@/config/constants';
import { fetchWishlist } from '../api/wishlist';

export function useWishlist(page: number) {
  return useQuery({
    queryKey: adminQueryKeys.wishlist.list({ page }),
    queryFn: () => fetchWishlist(page),
    staleTime: QUERY_STALE_TIME.short,
  });
}
