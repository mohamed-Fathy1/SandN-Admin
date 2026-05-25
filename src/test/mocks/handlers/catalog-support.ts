import { http, HttpResponse } from 'msw';
import type { ApiColor, ApiSize, ApiSubCategory } from '@/shared/types/api';

const API = 'https://api.test.local';

const colors: ApiColor[] = [
  {
    _id: 'color-1',
    name: { en: 'Black', ar: 'أسود' },
    hex: '#000000',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const sizes: ApiSize[] = [
  {
    _id: 'size-1',
    size: 'M',
    order: 1,
    groupSize: 'grp-1',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const subCategories: ApiSubCategory[] = [
  {
    _id: 'sub-1',
    name: { en: 'Everyday', ar: 'يومي' },
    image: {
      mediaUrl: 'https://cdn.test/everyday.jpg',
      mediaId: 'SubCategory/everyday',
    },
    groupSize: 'grp-1',
    category: 'cat-1',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const catalogSupportHandlers = [
  http.get(`${API}/color`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { colors },
      message: 'OK',
      success: true,
    })
  ),
  http.get(`${API}/group-size/all-size`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { sizes },
      message: 'OK',
      success: true,
    })
  ),
  http.get(`${API}/sub-category/get-all-sub-categories`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { subCategories },
      message: 'OK',
      success: true,
    })
  ),
];
