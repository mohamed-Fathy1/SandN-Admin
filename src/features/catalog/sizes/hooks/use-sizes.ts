import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import { createSize, deleteSize, fetchSizes, fetchSizesByGroup, updateSize } from '../api/sizes';

export function useSizes() {
  return useQuery({
    queryKey: adminQueryKeys.sizes.all,
    queryFn: fetchSizes,
    staleTime: QUERY_STALE_TIME.long,
  });
}

export function useSizesByGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.sizes.byGroup(groupId ?? ''),
    queryFn: () => fetchSizesByGroup(groupId!),
    enabled: Boolean(groupId),
    staleTime: QUERY_STALE_TIME.long,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSize,
    onSuccess: (size) => {
      const groupId = typeof size.groupSize === 'string' ? size.groupSize : size.groupSize._id;
      invalidators.afterSizeWrite(qc, groupId);
      toast.success('Size created');
    },
    onError: (err) => toastError(err, 'Failed to create size'),
  });
}

export function useUpdateSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateSize>[1] }) =>
      updateSize(id, payload),
    onSuccess: (size) => {
      const groupId = typeof size.groupSize === 'string' ? size.groupSize : size.groupSize._id;
      invalidators.afterSizeWrite(qc, groupId);
      toast.success('Size updated');
    },
    onError: (err) => toastError(err, 'Failed to update size'),
  });
}

export function useDeleteSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSize,
    onSuccess: () => {
      invalidators.afterSizeWrite(qc);
      toast.success('Size deleted');
    },
    onError: (err) => toastError(err, 'Failed to delete size'),
  });
}
