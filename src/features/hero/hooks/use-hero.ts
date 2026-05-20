import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import {
  createHeroSection,
  deleteHeroSection,
  fetchHeroSections,
  updateHeroSection,
} from '../api/hero';

export function useHeroSections() {
  return useQuery({
    queryKey: adminQueryKeys.hero.all,
    queryFn: fetchHeroSections,
    staleTime: QUERY_STALE_TIME.default,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateHeroSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHeroSection,
    onSuccess: () => {
      invalidators.afterHeroWrite(qc);
      toast.success('Hero slide created');
    },
    onError: (err) => toastError(err, 'Failed to create hero slide'),
  });
}

export function useUpdateHeroSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateHeroSection>[1];
    }) => updateHeroSection(id, payload),
    onSuccess: () => {
      invalidators.afterHeroWrite(qc);
      toast.success('Hero slide updated');
    },
    onError: (err) => toastError(err, 'Failed to update hero slide'),
  });
}

export function useDeleteHeroSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHeroSection,
    onSuccess: () => {
      invalidators.afterHeroWrite(qc);
      toast.success('Hero slide deleted');
    },
    onError: (err) => toastError(err, 'Failed to delete hero slide'),
  });
}
