import { http, HttpResponse } from 'msw';
import type { ApiShipping } from '@/shared/types/api';

const API = 'https://api.test.local';

const sample: ApiShipping[] = [
  { _id: 'ship-1', name: { en: 'Cairo', ar: 'القاهرة' }, cost: 75 },
  { _id: 'ship-2', name: { en: 'Alexandria', ar: 'الإسكندرية' }, cost: 90 },
];

export const shippingHandlers = [
  http.get(`${API}/shipping`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { shipping: sample },
      message: 'OK',
      success: true,
    })
  ),
];
