import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import {
  createSubCategory,
  fetchDeletedSubCategories,
  fetchSubCategories,
  fetchSubCategory,
  hardDeleteSubCategory,
  restoreSubCategory,
  softDeleteSubCategory,
  updateSubCategory,
} from '../api/sub-categories';

export function useSubCategories() {
  return useQuery({
    queryKey: adminQueryKeys.subCategories.all,
    queryFn: fetchSubCategories,
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useDeletedSubCategories() {
  return useQuery({
    queryKey: adminQueryKeys.subCategories.deleted,
    queryFn: fetchDeletedSubCategories,
    staleTime: QUERY_STALE_TIME.short,
  });
}

export function useSubCategory(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.subCategories.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useSubCategory called without id');
      return fetchSubCategory(id);
    },
    enabled: Boolean(id),
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      invalidators.afterSubCategoryWrite(qc);
      toast.success('Sub-category created');
    },
    onError: (err) => toastError(err, 'Failed to create sub-category'),
  });
}

export function useUpdateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateSubCategory>[1];
    }) => updateSubCategory(id, payload),
    onSuccess: () => {
      invalidators.afterSubCategoryWrite(qc);
      toast.success('Sub-category updated');
    },
    onError: (err) => toastError(err, 'Failed to update sub-category'),
  });
}

export function useSoftDeleteSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: softDeleteSubCategory,
    onSuccess: () => {
      invalidators.afterSubCategoryWrite(qc);
      toast.success('Sub-category removed');
    },
    onError: (err) => toastError(err, 'Failed to remove sub-category'),
  });
}

export function useRestoreSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreSubCategory,
    onSuccess: () => {
      invalidators.afterSubCategoryWrite(qc);
      toast.success('Sub-category restored');
    },
    onError: (err) => toastError(err, 'Failed to restore sub-category'),
  });
}

export function useHardDeleteSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: hardDeleteSubCategory,
    onSuccess: () => {
      invalidators.afterSubCategoryWrite(qc);
      toast.success('Sub-category deleted permanently');
    },
    onError: (err) => toastError(err, 'Failed to delete sub-category'),
  });
}
