import { api } from '@/shared/lib/axios';
import type { ApiResponse, BilingualText } from '@/shared/types';
import type { ApiShipping } from '@/shared/types/api';

export interface ShippingPayload {
  name: BilingualText;
  cost: number;
}

interface ShippingListResponse {
  shipping: ApiShipping[];
}
interface ShippingSingleResponse {
  shipping: ApiShipping;
}

export async function fetchShipping(): Promise<ApiShipping[]> {
  const { data } = await api.get<ApiResponse<ShippingListResponse>>('/shipping');
  return data.data?.shipping ?? [];
}

export async function fetchShippingOne(id: string): Promise<ApiShipping> {
  const { data } = await api.get<ApiResponse<ShippingSingleResponse>>(`/shipping/${id}`);
  return data.data.shipping;
}

export async function createShipping(payload: ShippingPayload): Promise<ApiShipping> {
  const { data } = await api.post<ApiResponse<ShippingSingleResponse>>('/shipping', payload);
  return data.data.shipping;
}

export async function updateShipping(
  id: string,
  payload: ShippingPayload
): Promise<ApiShipping> {
  const { data } = await api.patch<ApiResponse<ShippingSingleResponse>>(
    `/shipping/${id}`,
    payload
  );
  return data.data.shipping;
}

export async function deleteShipping(id: string): Promise<void> {
  await api.delete(`/shipping/${id}`);
}
