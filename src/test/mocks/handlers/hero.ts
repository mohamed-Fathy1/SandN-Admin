import { http, HttpResponse } from 'msw';
import type { ApiHeroSection } from '@/shared/types/api';

const API = 'https://api.test.local';

const sample: ApiHeroSection[] = [
  {
    _id: 'hero-1',
    images: {
      image1: { imageUrl: 'https://cdn.test/h1-small.jpg', imageType: 'small' },
      image2: { imageUrl: 'https://cdn.test/h1-large.jpg', imageType: 'large' },
    },
  },
];

export const heroHandlers = [
  http.get(`${API}/hero-section/all`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { heroSections: sample },
      message: 'OK',
      success: true,
    })
  ),
];
