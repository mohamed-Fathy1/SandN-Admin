import { api } from '@/shared/lib/axios';
import type { ApiResponse, BilingualText } from '@/shared/types';
import type { ApiCategory } from '@/shared/types/api';

export interface CategoryPayload {
  name: BilingualText;
  groupSize: string;
  imageUrl: string;
}

interface CategoryListResponse {
  categories: ApiCategory[];
}
interface CategorySingleResponse {
  category: ApiCategory;
}
interface CategoryUpdateResponse {
  updates: ApiCategory;
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const { data } = await api.get<ApiResponse<CategoryListResponse>>(
    '/category/get-all-categories'
  );
  return data.data?.categories ?? [];
}

export async function fetchDeletedCategories(): Promise<ApiCategory[]> {
  const { data } = await api.get<ApiResponse<CategoryListResponse>>(
    '/category/all-categories-deleted'
  );
  return data.data?.categories ?? [];
}

export async function fetchCategory(id: string): Promise<ApiCategory> {
  const { data } = await api.get<ApiResponse<CategorySingleResponse>>(
    `/category/get-one-category/${id}`
  );
  return data.data.category;
}

export async function createCategory(payload: CategoryPayload): Promise<ApiCategory> {
  const { data } = await api.post<ApiResponse<CategorySingleResponse>>(
    '/category/create',
    payload
  );
  return data.data.category;
}

export async function updateCategory(
  id: string,
  payload: CategoryPayload
): Promise<ApiCategory> {
  const { data } = await api.patch<ApiResponse<CategoryUpdateResponse>>(
    `/category/update/${id}`,
    payload
  );
  return data.data.updates;
}

// Backend uses PATCH for soft-delete (flips an `isDeleted` flag). The DELETE verb is reserved for
// hard-delete below. Keep them aligned with the API contract.
export async function softDeleteCategory(id: string): Promise<void> {
  await api.patch(`/category/soft-delete/${id}`);
}

export async function restoreCategory(id: string): Promise<void> {
  await api.patch(`/category/restore/${id}`);
}

export async function hardDeleteCategory(id: string): Promise<void> {
  await api.delete(`/category/hard-delete/${id}`);
}
