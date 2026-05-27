import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import type { ApiSocialReview } from '@/shared/types/api';
import {
  createSocialReview,
  deleteSocialReview,
  fetchSocialReview,
  fetchSocialReviews,
  updateSocialReview,
} from '../api/social-reviews';

export function useSocialReviews() {
  return useQuery({
    queryKey: adminQueryKeys.socialReviews.all,
    queryFn: fetchSocialReviews,
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useSocialReview(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.socialReviews.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useSocialReview called without id');
      return fetchSocialReview(id);
    },
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.default,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateSocialReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSocialReview,
    onSuccess: () => {
      invalidators.afterSocialReviewWrite(qc);
      toast.success('Social review added');
    },
    onError: (err) => toastError(err, 'Failed to add social review'),
  });
}

export function useUpdateSocialReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string }) =>
      updateSocialReview(id, imageUrl),
    onSuccess: (_data, vars) => {
      invalidators.afterSocialReviewWrite(qc);
      qc.invalidateQueries({ queryKey: adminQueryKeys.socialReviews.detail(vars.id) });
      toast.success('Social review updated');
    },
    onError: (err) => toastError(err, 'Failed to update social review'),
  });
}

export function useDeleteSocialReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSocialReview,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: adminQueryKeys.socialReviews.all });
      const previous = qc.getQueryData<ApiSocialReview[]>(adminQueryKeys.socialReviews.all);
      qc.setQueryData<ApiSocialReview[]>(adminQueryKeys.socialReviews.all, (old) =>
        (old ?? []).filter((r) => r._id !== id)
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(adminQueryKeys.socialReviews.all, context.previous);
      }
      toastError(err, 'Failed to delete social review');
    },
    onSuccess: () => {
      toast.success('Social review deleted');
    },
    onSettled: () => {
      invalidators.afterSocialReviewWrite(qc);
    },
  });
}
