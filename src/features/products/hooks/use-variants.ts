import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import {
  bulkDeleteVariants,
  bulkUpdateVariants,
  createVariant,
  deleteVariant,
  fetchVariantsByProduct,
  updateVariant,
  type BulkUpdateVariant,
  type CreateVariantPayload,
  type UpdateVariantPayload,
} from '../api/variants';

export function useVariantsByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.variants.byProduct(productId ?? ''),
    queryFn: () => {
      if (!productId) throw new Error('useVariantsByProduct called without productId');
      return fetchVariantsByProduct(productId);
    },
    enabled: Boolean(productId),
    staleTime: QUERY_STALE_TIME.short,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVariantPayload) => createVariant(payload),
    onSuccess: () => {
      invalidators.afterVariantWrite(qc, productId);
      toast.success('Variant added');
    },
    onError: (err) => toastError(err, 'Failed to add variant'),
  });
}

export function useUpdateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVariantPayload }) =>
      updateVariant(id, payload),
    onSuccess: () => {
      invalidators.afterVariantWrite(qc, productId);
      toast.success('Variant updated');
    },
    onError: (err) => toastError(err, 'Failed to update variant'),
  });
}

export function useDeleteVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVariant,
    onSuccess: () => {
      invalidators.afterVariantWrite(qc, productId);
      toast.success('Variant removed');
    },
    onError: (err) => toastError(err, 'Failed to remove variant'),
  });
}

export function useBulkUpdateVariants(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variants: BulkUpdateVariant[]) => bulkUpdateVariants(productId, variants),
    onSuccess: () => {
      invalidators.afterVariantWrite(qc, productId);
      toast.success('Variants saved');
    },
    onError: (err) => toastError(err, 'Failed to save variants'),
  });
}

export function useBulkDeleteVariants(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantIds: string[]) => bulkDeleteVariants(productId, variantIds),
    onSuccess: () => {
      invalidators.afterVariantWrite(qc, productId);
      toast.success('Variants removed');
    },
    onError: (err) => toastError(err, 'Failed to remove variants'),
  });
}
