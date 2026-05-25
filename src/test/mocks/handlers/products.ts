import { http, HttpResponse } from 'msw';
import type { ApiProduct } from '@/shared/types/api';
import type { ProductPayload } from '@/features/products/api/products';

const API = 'https://api.test.local';

const store = new Map<string, ApiProduct>();

function urlToMedia(url: string) {
  const mediaId = url.split('amazonaws.com/').pop() ?? url;
  return { mediaUrl: url, mediaId };
}

function makeProduct(id: string, payload: ProductPayload): ApiProduct {
  return {
    _id: id,
    name: payload.name,
    description: payload.description,
    price: payload.price,
    wholesalePrice: payload.wholesalePrice,
    salePrice: payload.salePrice,
    saleStartDate: payload.saleStartDate,
    saleEndDate: payload.saleEndDate,
    category: payload.category,
    subCategory: payload.subCategory,
    defaultImage: urlToMedia(payload.defaultImage),
    albumImages: payload.albumImages.map(urlToMedia),
    sizeChartImage: payload.sizeChartImage ? urlToMedia(payload.sizeChartImage) : undefined,
    variants: [],
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
  };
}

export function resetProductsStore() {
  store.clear();
}

export const productsHandlers = [
  http.get(`${API}/product/get-all-products`, () => {
    const products = Array.from(store.values());
    return HttpResponse.json({
      statusCode: 200,
      data: {
        products,
        currentPage: 1,
        totalPages: 1,
        totalItems: products.length,
      },
      message: 'OK',
      success: true,
    });
  }),

  http.get(`${API}/product/get-one-product/:id`, ({ params }) => {
    const id = String(params.id);
    const product = store.get(id);
    if (!product) {
      return HttpResponse.json(
        { statusCode: 404, success: false, message: 'Product not found', error: [] },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      data: { product },
      message: 'OK',
      success: true,
    });
  }),

  http.post(`${API}/product/create`, async ({ request }) => {
    const payload = (await request.json()) as ProductPayload;
    const id = `prod-${store.size + 1}`;
    const product = makeProduct(id, payload);
    store.set(id, product);
    return HttpResponse.json({
      statusCode: 200,
      data: { product },
      message: 'Created',
      success: true,
    });
  }),

  http.get(`${API}/product/get-analysis`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { total: store.size, active: store.size, deleted: 0 },
      message: 'OK',
      success: true,
    })
  ),
];
