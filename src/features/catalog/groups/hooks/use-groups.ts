import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import { fetchGroups, fetchGroup, createGroup, updateGroup } from '../api/groups';

export function useGroups() {
  return useQuery({
    queryKey: adminQueryKeys.groups.all,
    queryFn: fetchGroups,
    staleTime: QUERY_STALE_TIME.long,
  });
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.groups.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useGroup called without id');
      return fetchGroup(id);
    },
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.long,
  });
}

function toastError(err: unknown, fallback: string) {
  if (err instanceof ApiError) toast.error(err.message);
  else toast.error(fallback);
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      invalidators.afterGroupWrite(qc);
      toast.success('Group created');
    },
    onError: (err) => toastError(err, 'Failed to create group'),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateGroup>[1] }) =>
      updateGroup(id, payload),
    onSuccess: () => {
      invalidators.afterGroupWrite(qc);
      toast.success('Group updated');
    },
    onError: (err) => toastError(err, 'Failed to update group'),
  });
}
