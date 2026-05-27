import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiSize } from '@/shared/types/api';

interface SizePayload {
  groupSize: string;
  size: string;
  order: number;
}

interface SizeListResponse {
  sizeCategories: ApiSize[];
}
interface SizeSingleResponse {
  size: ApiSize;
}

export async function fetchSizes(): Promise<ApiSize[]> {
  const { data } = await api.get<ApiResponse<SizeListResponse>>('/group-size/all-size');
  return data.data?.sizeCategories ?? [];
}

export async function fetchSizesByGroup(groupId: string): Promise<ApiSize[]> {
  const { data } = await api.get<ApiResponse<SizeListResponse>>(
    `/group-size/all-sizes-by-group/${groupId}`
  );
  return data.data?.sizeCategories ?? [];
}

export async function fetchSize(id: string): Promise<ApiSize> {
  const { data } = await api.get<ApiResponse<SizeSingleResponse>>(`/group-size/one-size/${id}`);
  return data.data.size;
}

export async function createSize(payload: SizePayload): Promise<ApiSize> {
  const { data } = await api.post<ApiResponse<SizeSingleResponse>>('/group-size/size', payload);
  return data.data.size;
}

export async function updateSize(id: string, payload: SizePayload): Promise<ApiSize> {
  const { data } = await api.patch<ApiResponse<SizeSingleResponse>>(
    `/group-size/size/${id}`,
    payload
  );
  return data.data.size;
}

export async function deleteSize(id: string): Promise<void> {
  await api.delete(`/group-size/size/${id}`);
}
