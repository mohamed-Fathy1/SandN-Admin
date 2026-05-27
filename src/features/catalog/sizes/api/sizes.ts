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

/**
 * The size resource is wrapped under different keys depending on the endpoint —
 * `sizeCategory` per spec for create, `size` historically for some others.
 * Accept either to stay forward-compatible.
 */
interface SizeSingleResponse {
  sizeCategory?: ApiSize;
  size?: ApiSize;
}

function unwrap(res: SizeSingleResponse): ApiSize {
  const value = res.sizeCategory ?? res.size;
  if (!value) {
    throw new Error('Size response payload was empty');
  }
  return value;
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
  return unwrap(data.data);
}

export async function createSize(payload: SizePayload): Promise<ApiSize> {
  const { data } = await api.post<ApiResponse<SizeSingleResponse>>('/group-size/size', payload);
  return unwrap(data.data);
}

export async function updateSize(id: string, payload: SizePayload): Promise<ApiSize> {
  const { data } = await api.patch<ApiResponse<SizeSingleResponse>>(
    `/group-size/size/${id}`,
    payload
  );
  return unwrap(data.data);
}

export async function deleteSize(id: string): Promise<void> {
  await api.delete(`/group-size/size/${id}`);
}
