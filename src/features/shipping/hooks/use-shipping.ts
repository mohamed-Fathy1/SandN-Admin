import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import {
  createShipping,
  deleteShipping,
  fetchShipping,
  updateShipping,
} from '../api/shipping';

export function useShipping() {
  return useQuery({
    queryKey: adminQueryKeys.shipping.all,
    queryFn: fetchShipping,
    staleTime: QUERY_STALE_TIME.default,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createShipping,
    onSuccess: () => {
      invalidators.afterShippingWrite(qc);
      toast.success('Shipping region created');
    },
    onError: (err) => toastError(err, 'Failed to create shipping region'),
  });
}

export function useUpdateShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateShipping>[1];
    }) => updateShipping(id, payload),
    onSuccess: () => {
      invalidators.afterShippingWrite(qc);
      toast.success('Shipping region updated');
    },
    onError: (err) => toastError(err, 'Failed to update shipping region'),
  });
}

export function useDeleteShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteShipping,
    onSuccess: () => {
      invalidators.afterShippingWrite(qc);
      toast.success('Shipping region deleted');
    },
    onError: (err) => toastError(err, 'Failed to delete shipping region'),
  });
}
