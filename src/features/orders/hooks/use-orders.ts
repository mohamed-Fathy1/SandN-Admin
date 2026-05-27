import { useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME, ORDER_STATUSES, type OrderStatus } from '@/config/constants';
import {
  applyFreeShipping,
  fetchOrder,
  fetchOrders,
  updateOrderStatus,
} from '../api/orders';

export function prefetchOrder(qc: QueryClient, id: string) {
  return qc.prefetchQuery({
    queryKey: adminQueryKeys.orders.detail(id),
    queryFn: () => fetchOrder(id),
  });
}

export function useOrdersByStatusCounts() {
  return useQueries({
    queries: ORDER_STATUSES.map((status) => ({
      queryKey: adminQueryKeys.orders.list({ page: 1, status }),
      queryFn: () => fetchOrders({ page: 1, status }),
      staleTime: 30_000,
    })),
  });
}

interface UseOrdersArgs {
  page: number;
  status?: OrderStatus;
}

export function useOrders({ page, status }: UseOrdersArgs) {
  return useQuery({
    queryKey: adminQueryKeys.orders.list({ page, status }),
    queryFn: () => fetchOrders({ page, status }),
    staleTime: QUERY_STALE_TIME.short,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.orders.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useOrder called without id');
      return fetchOrder(id);
    },
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.short,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: (_data, vars) => {
      invalidators.afterOrderWrite(qc, vars.id);
      toast.success('Order updated');
    },
    onError: (err) => toastError(err, 'Failed to update order'),
  });
}

export function useApplyFreeShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applyFreeShipping(id),
    onSuccess: (_data, id) => {
      invalidators.afterOrderWrite(qc, id);
      toast.success('Free shipping applied');
    },
    onError: (err) => toastError(err, 'Failed to apply free shipping'),
  });
}
