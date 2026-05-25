import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiVariant } from '@/shared/types/api';

export interface CreateVariantPayload {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface UpdateVariantPayload {
  size?: string;
  color?: string;
  quantity?: number;
}

export interface BulkUpdateVariant {
  _id: string;
  size?: string;
  color?: string;
  quantity?: number;
}

interface VariantListResponse {
  variants: ApiVariant[];
}
interface VariantSingleResponse {
  variant: ApiVariant;
}

export async function fetchVariantsByProduct(productId: string): Promise<ApiVariant[]> {
  const { data } = await api.get<ApiResponse<VariantListResponse>>(
    `/variant/product/${productId}`
  );
  return data.data?.variants ?? [];
}

export async function createVariant(payload: CreateVariantPayload): Promise<ApiVariant> {
  const { data } = await api.post<ApiResponse<VariantSingleResponse>>('/variant', payload);
  return data.data.variant;
}

export async function updateVariant(
  id: string,
  payload: UpdateVariantPayload
): Promise<ApiVariant> {
  const { data } = await api.patch<ApiResponse<VariantSingleResponse>>(`/variant/${id}`, payload);
  return data.data.variant;
}

export async function deleteVariant(id: string): Promise<void> {
  await api.delete(`/variant/${id}`);
}

export async function bulkUpdateVariants(
  productId: string,
  variants: BulkUpdateVariant[]
): Promise<ApiVariant[]> {
  const { data } = await api.patch<ApiResponse<VariantListResponse>>('/variant/bulk', {
    productId,
    variants,
  });
  return data.data.variants;
}

export async function bulkDeleteVariants(productId: string, variantIds: string[]): Promise<void> {
  await api.delete('/variant/bulk', { data: { productId, variantIds } });
}
