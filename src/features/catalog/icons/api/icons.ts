import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiCategoryIcon } from '@/shared/types/api';

export interface CreateIconPayload {
  key: string;
  svg: string;
  isActive?: boolean;
}

export interface UpdateIconPayload {
  svg?: string;
  isActive?: boolean;
}

interface IconsListResponse {
  icons: ApiCategoryIcon[];
}

interface IconSingleResponse {
  icon: ApiCategoryIcon;
}

export async function fetchIcons(): Promise<ApiCategoryIcon[]> {
  const { data } = await api.get<ApiResponse<IconsListResponse>>('/icons');
  return data.data?.icons ?? [];
}

export async function fetchIconByKey(key: string): Promise<ApiCategoryIcon> {
  const { data } = await api.get<ApiResponse<IconSingleResponse>>(
    `/icons/${encodeURIComponent(key)}`
  );
  return data.data.icon;
}

export async function createIcon(payload: CreateIconPayload): Promise<ApiCategoryIcon> {
  const { data } = await api.post<ApiResponse<IconSingleResponse>>('/icons', payload);
  return data.data.icon;
}

export async function updateIcon(
  key: string,
  payload: UpdateIconPayload
): Promise<ApiCategoryIcon> {
  const { data } = await api.put<ApiResponse<IconSingleResponse>>(
    `/icons/${encodeURIComponent(key)}`,
    payload
  );
  return data.data.icon;
}

export async function deleteIcon(key: string): Promise<void> {
  await api.delete(`/icons/${encodeURIComponent(key)}`);
}
