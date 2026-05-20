import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import { createColor, deleteColor, fetchColor, fetchColors, updateColor } from '../api/colors';

export function useColors() {
  return useQuery({
    queryKey: adminQueryKeys.colors.all,
    queryFn: fetchColors,
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useColor(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.colors.detail(id ?? ''),
    queryFn: () => fetchColor(id!),
    enabled: Boolean(id),
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createColor,
    onSuccess: () => {
      invalidators.afterColorWrite(qc);
      toast.success('Color created');
    },
    onError: (err) => toastError(err, 'Failed to create color'),
  });
}

export function useUpdateColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateColor>[1] }) =>
      updateColor(id, payload),
    onSuccess: () => {
      invalidators.afterColorWrite(qc);
      toast.success('Color updated');
    },
    onError: (err) => toastError(err, 'Failed to update color'),
  });
}

export function useDeleteColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteColor,
    onSuccess: () => {
      invalidators.afterColorWrite(qc);
      toast.success('Color deleted');
    },
    onError: (err) => toastError(err, 'Failed to delete color'),
  });
}
