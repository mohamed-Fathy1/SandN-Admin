import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiWishlistItem } from '@/shared/types/api';

export interface WishlistListResponse {
  wishlistItems: ApiWishlistItem[];
  currentPage: number;
  totalPages: number;
  totalItems?: number;
}

interface RawWishlistResponse {
  wishlistItems?: ApiWishlistItem[];
  items?: ApiWishlistItem[];
  wishlist?: ApiWishlistItem[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
}

export async function fetchWishlist(page: number): Promise<WishlistListResponse> {
  const { data } = await api.get<ApiResponse<RawWishlistResponse>>('/wishlist', {
    params: { page },
  });
  const raw = data.data ?? {};
  return {
    wishlistItems: raw.wishlistItems ?? raw.items ?? raw.wishlist ?? [],
    currentPage: raw.currentPage ?? page,
    totalPages: raw.totalPages ?? 1,
    totalItems: raw.totalItems,
  };
}
