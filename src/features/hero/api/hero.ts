import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiHeroSection } from '@/shared/types/api';

export interface HeroPayload {
  smallImageUrl: string;
  largeImageUrl: string;
}

interface HeroListResponse {
  heroSections: ApiHeroSection[];
}
interface HeroSingleResponse {
  heroSection: ApiHeroSection;
}

function toServerBody(payload: HeroPayload) {
  return {
    images: {
      image1: { imageUrl: payload.smallImageUrl, imageType: 'small' as const },
      image2: { imageUrl: payload.largeImageUrl, imageType: 'large' as const },
    },
  };
}

export async function fetchHeroSections(): Promise<ApiHeroSection[]> {
  const { data } = await api.get<ApiResponse<HeroListResponse>>('/hero-section/all');
  return data.data.heroSections;
}

export async function createHeroSection(payload: HeroPayload): Promise<ApiHeroSection> {
  const { data } = await api.post<ApiResponse<HeroSingleResponse>>(
    '/hero-section/create',
    toServerBody(payload)
  );
  return data.data.heroSection;
}

export async function updateHeroSection(
  id: string,
  payload: HeroPayload
): Promise<ApiHeroSection> {
  const { data } = await api.patch<ApiResponse<HeroSingleResponse>>(
    `/hero-section/${id}`,
    toServerBody(payload)
  );
  return data.data.heroSection;
}

export async function deleteHeroSection(id: string): Promise<void> {
  await api.delete(`/hero-section/${id}`);
}
