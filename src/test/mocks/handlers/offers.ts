import { http, HttpResponse } from 'msw';
import type { ApiOffer } from '@/shared/types/api';

const API = 'https://api.test.local';

const store = new Map<string, ApiOffer>([
  [
    'off-1',
    {
      _id: 'off-1',
      type: 'fixed_discount',
      isActive: true,
      image: { mediaUrl: 'https://cdn.test/o1.jpg', mediaId: 'Offers/o1' },
      description: { en: '100 EGP off on 3000 EGP', ar: 'خصم 100 على 3000' },
      minOrderAmount: 3000,
      discountAmount: 100,
    },
  ],
  [
    'off-2',
    {
      _id: 'off-2',
      type: 'free_shipping',
      isActive: false,
      image: { mediaUrl: 'https://cdn.test/o2.jpg', mediaId: 'Offers/o2' },
      description: { en: 'Free shipping above 500 EGP', ar: 'شحن مجاني فوق 500' },
      minOrderAmount: 500,
    },
  ],
]);

export function resetOffersStore() {
  store.clear();
  store.set('off-1', {
    _id: 'off-1',
    type: 'fixed_discount',
    isActive: true,
    image: { mediaUrl: 'https://cdn.test/o1.jpg', mediaId: 'Offers/o1' },
    description: { en: '100 EGP off on 3000 EGP', ar: 'خصم 100 على 3000' },
    minOrderAmount: 3000,
    discountAmount: 100,
  });
  store.set('off-2', {
    _id: 'off-2',
    type: 'free_shipping',
    isActive: false,
    image: { mediaUrl: 'https://cdn.test/o2.jpg', mediaId: 'Offers/o2' },
    description: { en: 'Free shipping above 500 EGP', ar: 'شحن مجاني فوق 500' },
    minOrderAmount: 500,
  });
}

export const offersHandlers = [
  http.get(`${API}/offers`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { offers: Array.from(store.values()) },
      message: 'OK',
      success: true,
    })
  ),

  http.patch(`${API}/offers/toggle/:id`, async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { isActive: boolean };
    const current = store.get(id);
    if (!current) {
      return HttpResponse.json(
        { statusCode: 404, success: false, message: 'Offer not found', error: [] },
        { status: 404 }
      );
    }
    const next: ApiOffer = { ...current, isActive: body.isActive };
    store.set(id, next);
    return HttpResponse.json({
      statusCode: 200,
      data: { offer: next },
      message: 'OK',
      success: true,
    });
  }),
];
