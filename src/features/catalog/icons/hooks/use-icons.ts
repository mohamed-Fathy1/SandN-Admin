import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import {
  createIcon,
  deleteIcon,
  fetchIconByKey,
  fetchIcons,
  updateIcon,
  type UpdateIconPayload,
} from '../api/icons';

export function useIcons() {
  return useQuery({
    queryKey: adminQueryKeys.categoryIcons.all,
    queryFn: fetchIcons,
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useIcon(key: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.categoryIcons.detail(key ?? ''),
    queryFn: () => {
      if (!key) throw new Error('useIcon called without key');
      return fetchIconByKey(key);
    },
    enabled: Boolean(key),
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createIcon,
    onSuccess: () => {
      invalidators.afterCategoryIconWrite(qc);
      toast.success('Icon created');
    },
    onError: (err) => toastError(err, 'Failed to create icon'),
  });
}

export function useUpdateIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: UpdateIconPayload }) =>
      updateIcon(key, payload),
    onSuccess: () => {
      invalidators.afterCategoryIconWrite(qc);
      toast.success('Icon updated');
    },
    onError: (err) => toastError(err, 'Failed to update icon'),
  });
}

export function useDeleteIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteIcon,
    onSuccess: () => {
      invalidators.afterCategoryIconWrite(qc);
      toast.success('Icon deleted');
    },
    onError: (err) => toastError(err, 'Failed to delete icon'),
  });
}
