import { api } from '@/shared/lib/axios';
import type { ApiResponse, BilingualText } from '@/shared/types';
import type { ApiColor } from '@/shared/types/api';

interface ColorPayload {
  name: BilingualText;
  hex: string;
}

interface ColorListResponse {
  colors: ApiColor[];
}
interface ColorSingleResponse {
  color: ApiColor;
}

export async function fetchColors(): Promise<ApiColor[]> {
  const { data } = await api.get<ApiResponse<ColorListResponse>>('/color');
  return data.data.colors;
}

export async function fetchColor(id: string): Promise<ApiColor> {
  const { data } = await api.get<ApiResponse<ColorSingleResponse>>(`/color/${id}`);
  return data.data.color;
}

export async function createColor(payload: ColorPayload): Promise<ApiColor> {
  const { data } = await api.post<ApiResponse<ColorSingleResponse>>('/color', payload);
  return data.data.color;
}

export async function updateColor(id: string, payload: ColorPayload): Promise<ApiColor> {
  const { data } = await api.patch<ApiResponse<ColorSingleResponse>>(`/color/${id}`, payload);
  return data.data.color;
}

export async function deleteColor(id: string): Promise<void> {
  await api.delete(`/color/${id}`);
}
