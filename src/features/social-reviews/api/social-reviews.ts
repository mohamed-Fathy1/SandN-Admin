import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiSocialReview } from '@/shared/types/api';

interface ListResponse {
  reviews: ApiSocialReview[];
}
interface SingleResponse {
  review: ApiSocialReview;
}

export async function fetchSocialReviews(): Promise<ApiSocialReview[]> {
  const { data } = await api.get<ApiResponse<ListResponse>>('/social-review');
  return data.data.reviews ?? [];
}

export async function fetchSocialReview(id: string): Promise<ApiSocialReview> {
  const { data } = await api.get<ApiResponse<SingleResponse>>(`/social-review/${id}`);
  return data.data.review;
}

export async function createSocialReview(imageUrl: string): Promise<ApiSocialReview> {
  const { data } = await api.post<ApiResponse<SingleResponse>>('/social-review', {
    imageUrl,
  });
  return data.data.review;
}

export async function updateSocialReview(
  id: string,
  imageUrl: string
): Promise<ApiSocialReview> {
  const { data } = await api.patch<ApiResponse<SingleResponse>>(`/social-review/${id}`, {
    imageUrl,
  });
  return data.data.review;
}

export async function deleteSocialReview(id: string): Promise<void> {
  await api.delete(`/social-review/${id}`);
}
