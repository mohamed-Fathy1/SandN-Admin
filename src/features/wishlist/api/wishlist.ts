import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiWishlistEntry, ApiWishlistPage } from '@/shared/types/api';

export interface WishlistListResponse {
  items: ApiWishlistEntry[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface RawWishlistResponse {
  wishlist?: Partial<ApiWishlistPage> | null;
}

export async function fetchWishlist(page: number): Promise<WishlistListResponse> {
  const { data } = await api.get<ApiResponse<RawWishlistResponse>>('/wishlist', {
    params: { page },
  });
  const wishlist = data.data?.wishlist ?? {};
  return {
    items: Array.isArray(wishlist.products) ? wishlist.products : [],
    currentPage: wishlist.currentPage ?? page,
    totalPages: wishlist.totalPages ?? 0,
    totalItems: wishlist.totalItems ?? 0,
  };
}
