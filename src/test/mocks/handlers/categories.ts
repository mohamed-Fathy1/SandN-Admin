import { http, HttpResponse } from 'msw';
import type { ApiCategory } from '@/shared/types/api';

const API = 'https://api.test.local';

const sample: ApiCategory[] = [
  {
    _id: 'cat-1',
    name: { en: 'Bras', ar: 'حمالة صدر' },
    image: { mediaUrl: 'https://cdn.test/bras.jpg', mediaId: 'Category/bras' },
    groupSize: 'grp-1',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'cat-2',
    name: { en: 'Panties', ar: 'سراويل' },
    image: { mediaUrl: 'https://cdn.test/panties.jpg', mediaId: 'Category/panties' },
    groupSize: 'grp-1',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

export const categoryHandlers = [
  http.get(`${API}/category/get-all-categories`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { categories: sample },
      message: 'OK',
      success: true,
    })
  ),
  http.get(`${API}/category/all-categories-deleted`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { categories: [] },
      message: 'OK',
      success: true,
    })
  ),
];
