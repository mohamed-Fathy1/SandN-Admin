import { api } from '@/shared/lib/axios';
import type { ApiResponse, BilingualText } from '@/shared/types';
import type { ApiSubCategory } from '@/shared/types/api';

export interface SubCategoryPayload {
  name: BilingualText;
  groupSize: string;
  category: string;
  imageUrl: string;
}

interface SubCategoryListResponse {
  subCategories: ApiSubCategory[];
}
interface SubCategorySingleResponse {
  subCategory: ApiSubCategory;
}
interface SubCategoryUpdateResponse {
  updates: ApiSubCategory;
}

export async function fetchSubCategories(): Promise<ApiSubCategory[]> {
  const { data } = await api.get<ApiResponse<SubCategoryListResponse>>(
    '/sub-category/get-all-sub-categories'
  );
  return data.data?.subCategories ?? [];
}

export async function fetchDeletedSubCategories(): Promise<ApiSubCategory[]> {
  const { data } = await api.get<ApiResponse<SubCategoryListResponse>>(
    '/sub-category/all-deleted-sub-categories'
  );
  return data.data?.subCategories ?? [];
}

export async function fetchSubCategory(id: string): Promise<ApiSubCategory> {
  const { data } = await api.get<ApiResponse<SubCategorySingleResponse>>(
    `/sub-category/get-one-sub-category/${id}`
  );
  return data.data.subCategory;
}

export async function createSubCategory(payload: SubCategoryPayload): Promise<ApiSubCategory> {
  const { data } = await api.post<ApiResponse<SubCategorySingleResponse>>(
    '/sub-category/create',
    payload
  );
  return data.data.subCategory;
}

export async function updateSubCategory(
  id: string,
  payload: SubCategoryPayload
): Promise<ApiSubCategory> {
  const { data } = await api.patch<ApiResponse<SubCategoryUpdateResponse>>(
    `/sub-category/update/${id}`,
    payload
  );
  return data.data.updates;
}

export async function softDeleteSubCategory(id: string): Promise<void> {
  await api.patch(`/sub-category/soft-delete/${id}`);
}

export async function restoreSubCategory(id: string): Promise<void> {
  await api.patch(`/sub-category/restore/${id}`);
}

export async function hardDeleteSubCategory(id: string): Promise<void> {
  await api.delete(`/sub-category/hard-delete/${id}`);
}
