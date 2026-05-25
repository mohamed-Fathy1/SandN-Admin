import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiWishlistItem } from '@/shared/types/api';

export interface WishlistListResponse {
  wishlistItems: ApiWishlistItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export async function fetchWishlist(page: number): Promise<WishlistListResponse> {
  const { data } = await api.get<ApiResponse<WishlistListResponse>>('/wishlist', {
    params: { page },
  });
  return data.data ?? { wishlistItems: [], currentPage: page, totalPages: 0, totalItems: 0 };
}
