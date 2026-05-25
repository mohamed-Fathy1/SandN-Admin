import { http, HttpResponse } from 'msw';
import type { ApiHeroSection } from '@/shared/types/api';

const API = 'https://api.test.local';

const sample: ApiHeroSection[] = [
  {
    _id: 'hero-1',
    images: {
      image1: {
        mediaUrl: 'https://cdn.test/h1-small.jpg',
        mediaId: 'ImageSlider/h1-small',
        mediaType: 'small',
      },
      image2: {
        mediaUrl: 'https://cdn.test/h1-large.jpg',
        mediaId: 'ImageSlider/h1-large',
        mediaType: 'large',
      },
    },
  },
];

export const heroHandlers = [
  http.get(`${API}/hero-section/all`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { imageSlider: sample },
      message: 'OK',
      success: true,
    })
  ),
];
