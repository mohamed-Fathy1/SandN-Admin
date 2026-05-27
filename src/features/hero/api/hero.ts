import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiHeroSection } from '@/shared/types/api';

export interface HeroPayload {
  smallImageUrl: string;
  largeImageUrl: string;
}

interface HeroListResponse {
  imageSlider: ApiHeroSection[];
}
interface HeroSingleResponse {
  imageSlider: ApiHeroSection;
}
interface HeroWriteResponse {
  media: ApiHeroSection;
}

function toServerBody(payload: HeroPayload) {
  return {
    images: {
      image1: { imageUrl: payload.smallImageUrl, imageType: 'small' as const },
      image2: { imageUrl: payload.largeImageUrl, imageType: 'large' as const },
    },
  };
}

/**
 * The API spec keys hero images by `imageType` ('small' | 'large') rather than
 * positional `image1`/`image2`. Use this helper to pull the right one regardless
 * of which slot the server stored it in.
 */
export function findHeroImageUrl(
  hero: import('@/shared/types/api').ApiHeroSection | null | undefined,
  type: 'small' | 'large'
): string {
  if (!hero) return '';
  const { image1, image2 } = hero.images ?? {};
  if (image1?.imageType === type) return image1.mediaUrl;
  if (image2?.imageType === type) return image2.mediaUrl;
  // Fallback to positional convention (image1=small, image2=large) for legacy data.
  if (type === 'small') return image1?.mediaUrl ?? '';
  return image2?.mediaUrl ?? '';
}

export async function fetchHeroSections(): Promise<ApiHeroSection[]> {
  const { data } = await api.get<ApiResponse<HeroListResponse>>('/hero-section/all');
  return data.data.imageSlider ?? [];
}

export async function fetchHeroSection(id: string): Promise<ApiHeroSection> {
  const { data } = await api.get<ApiResponse<HeroSingleResponse>>(`/hero-section/${id}`);
  return data.data.imageSlider;
}

export async function createHeroSection(payload: HeroPayload): Promise<ApiHeroSection> {
  const { data } = await api.post<ApiResponse<HeroWriteResponse>>(
    '/hero-section/create',
    toServerBody(payload)
  );
  return data.data.media;
}

export async function updateHeroSection(
  id: string,
  payload: HeroPayload
): Promise<ApiHeroSection> {
  const { data } = await api.patch<ApiResponse<HeroWriteResponse>>(
    `/hero-section/${id}`,
    toServerBody(payload)
  );
  return data.data.media;
}

export async function deleteHeroSection(id: string): Promise<void> {
  await api.delete(`/hero-section/${id}`);
}
