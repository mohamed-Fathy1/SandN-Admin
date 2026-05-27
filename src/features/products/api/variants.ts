import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiVariant } from '@/shared/types/api';

export interface CreateVariantPayload {
  productId: string;
  /** Optional — server defaults to "one size" when omitted. */
  size?: string;
  color: string;
  quantity: number;
}

export interface UpdateVariantPayload {
  /** Required by the API to recalc the parent product's sold-out flag. */
  productId: string;
  quantity: number;
}

export interface BulkUpdateVariant {
  _id: string;
  size?: string;
  color?: string;
  quantity?: number;
}

export interface BulkWriteResult {
  matchedCount: number;
  modifiedCount: number;
}

export interface BulkDeleteResult {
  deletedCount: number;
}

interface VariantListResponse {
  variants: ApiVariant[];
}
interface VariantSingleResponse {
  variant: ApiVariant;
}
interface BulkResultResponse {
  result: BulkWriteResult;
}
interface BulkDeleteResponse {
  result: BulkDeleteResult;
}

export async function fetchVariantsByProduct(productId: string): Promise<ApiVariant[]> {
  const { data } = await api.get<ApiResponse<VariantListResponse>>(
    `/variant/product/${productId}`
  );
  return data.data?.variants ?? [];
}

export async function fetchVariant(id: string): Promise<ApiVariant> {
  const { data } = await api.get<ApiResponse<VariantSingleResponse>>(`/variant/${id}`);
  return data.data.variant;
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

export async function deleteVariant(id: string, productId: string): Promise<void> {
  await api.delete(`/variant/${id}`, { data: { productId } });
}

export async function bulkUpdateVariants(
  productId: string,
  variants: BulkUpdateVariant[]
): Promise<BulkWriteResult> {
  const { data } = await api.patch<ApiResponse<BulkResultResponse>>('/variant/bulk', {
    productId,
    variants,
  });
  return data.data.result;
}

export async function bulkDeleteVariants(
  productId: string,
  variantIds: string[]
): Promise<BulkDeleteResult> {
  const { data } = await api.delete<ApiResponse<BulkDeleteResponse>>('/variant/bulk', {
    data: { productId, variantIds },
  });
  return data.data.result;
}
