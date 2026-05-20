import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import type { ApiOffer } from '@/shared/types/api';
import {
  createOffer,
  deleteOffer,
  fetchOffers,
  toggleOffer,
  updateOffer,
} from '../api/offers';

export function useOffers() {
  return useQuery({
    queryKey: adminQueryKeys.offers.all,
    queryFn: fetchOffers,
    staleTime: QUERY_STALE_TIME.default,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOffer,
    onSuccess: () => {
      invalidators.afterOfferWrite(qc);
      toast.success('Offer created');
    },
    onError: (err) => toastError(err, 'Failed to create offer'),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateOffer>[1] }) =>
      updateOffer(id, payload),
    onSuccess: () => {
      invalidators.afterOfferWrite(qc);
      toast.success('Offer updated');
    },
    onError: (err) => toastError(err, 'Failed to update offer'),
  });
}

export function useToggleOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleOffer(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: adminQueryKeys.offers.all });
      const previous = qc.getQueryData<ApiOffer[]>(adminQueryKeys.offers.all);
      qc.setQueryData<ApiOffer[]>(adminQueryKeys.offers.all, (old) =>
        (old ?? []).map((o) => (o._id === id ? { ...o, isActive } : o))
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(adminQueryKeys.offers.all, context.previous);
      }
      toastError(err, 'Failed to toggle offer');
    },
    onSettled: () => {
      invalidators.afterOfferWrite(qc);
    },
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      invalidators.afterOfferWrite(qc);
      toast.success('Offer deleted');
    },
    onError: (err) => toastError(err, 'Failed to delete offer'),
  });
}
