import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiSocialReview } from '@/shared/types/api';

interface ListResponse {
  socialReviews: ApiSocialReview[];
}
interface SingleResponse {
  socialReview: ApiSocialReview;
}

export async function fetchSocialReviews(): Promise<ApiSocialReview[]> {
  const { data } = await api.get<ApiResponse<ListResponse>>('/social-review');
  return data.data.socialReviews;
}

export async function createSocialReview(imageUrl: string): Promise<ApiSocialReview> {
  const { data } = await api.post<ApiResponse<SingleResponse>>('/social-review', {
    imageUrl,
  });
  return data.data.socialReview;
}

export async function deleteSocialReview(id: string): Promise<void> {
  await api.delete(`/social-review/${id}`);
}
