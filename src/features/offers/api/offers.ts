import { api } from '@/shared/lib/axios';
import type { ApiResponse, BilingualText } from '@/shared/types';
import type { ApiOffer } from '@/shared/types/api';
import type { OfferType } from '@/config/constants';

export interface OfferPayload {
  type: OfferType;
  isActive: boolean;
  image: string;
  description: BilingualText;
  minOrderAmount: number;
  discountAmount?: number;
}

interface ListResponse {
  offers: ApiOffer[];
}
interface SingleResponse {
  offer: ApiOffer;
}

export async function fetchOffers(): Promise<ApiOffer[]> {
  const { data } = await api.get<ApiResponse<ListResponse>>('/offers');
  return data.data.offers ?? [];
}

export async function createOffer(payload: OfferPayload): Promise<ApiOffer> {
  const { data } = await api.post<ApiResponse<SingleResponse>>('/offers', payload);
  return data.data.offer;
}

export async function updateOffer(id: string, payload: OfferPayload): Promise<ApiOffer> {
  const { data } = await api.patch<ApiResponse<SingleResponse>>(`/offers/${id}`, payload);
  return data.data.offer;
}

export async function toggleOffer(id: string, isActive: boolean): Promise<ApiOffer> {
  const { data } = await api.patch<ApiResponse<SingleResponse>>(`/offers/toggle/${id}`, {
    isActive,
  });
  return data.data.offer;
}

export async function deleteOffer(id: string): Promise<void> {
  await api.delete(`/offers/${id}`);
}
