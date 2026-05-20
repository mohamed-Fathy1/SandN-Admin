import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import {
  createCategory,
  fetchCategories,
  fetchCategory,
  fetchDeletedCategories,
  hardDeleteCategory,
  restoreCategory,
  softDeleteCategory,
  updateCategory,
} from '../api/categories';

export function useCategories() {
  return useQuery({
    queryKey: adminQueryKeys.categories.all,
    queryFn: fetchCategories,
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useDeletedCategories() {
  return useQuery({
    queryKey: adminQueryKeys.categories.deleted,
    queryFn: fetchDeletedCategories,
    staleTime: QUERY_STALE_TIME.short,
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.categories.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useCategory called without id');
      return fetchCategory(id);
    },
    enabled: Boolean(id),
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      invalidators.afterCategoryWrite(qc);
      toast.success('Category created');
    },
    onError: (err) => toastError(err, 'Failed to create category'),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateCategory>[1];
    }) => updateCategory(id, payload),
    onSuccess: () => {
      invalidators.afterCategoryWrite(qc);
      toast.success('Category updated');
    },
    onError: (err) => toastError(err, 'Failed to update category'),
  });
}

export function useSoftDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: softDeleteCategory,
    onSuccess: () => {
      invalidators.afterCategoryWrite(qc);
      toast.success('Category removed');
    },
    onError: (err) => toastError(err, 'Failed to remove category'),
  });
}

export function useRestoreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreCategory,
    onSuccess: () => {
      invalidators.afterCategoryWrite(qc);
      toast.success('Category restored');
    },
    onError: (err) => toastError(err, 'Failed to restore category'),
  });
}

export function useHardDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: hardDeleteCategory,
    onSuccess: () => {
      invalidators.afterCategoryWrite(qc);
      toast.success('Category deleted permanently');
    },
    onError: (err) => toastError(err, 'Failed to delete category'),
  });
}
