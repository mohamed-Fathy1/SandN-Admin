import { http, HttpResponse } from 'msw';
import type { ApiProduct, ApiProductAnalysis } from '@/shared/types/api';
import type { ProductPayload } from '@/features/products/api/products';

const API = 'https://api.test.local';

const store = new Map<string, ApiProduct>();

function urlToMedia(url: string) {
  const mediaId = url.split('amazonaws.com/').pop() ?? url;
  return { mediaUrl: url, mediaId };
}

function makeProduct(id: string, payload: ProductPayload): ApiProduct {
  const price = payload.price ?? 0;
  const salePrice = payload.salePrice ?? 0;
  const isSale = salePrice > 0 && salePrice < price;
  return {
    _id: id,
    name: payload.name,
    description: payload.description,
    price,
    wholesalePrice: payload.wholesalePrice,
    salePrice,
    saleStartDate: payload.saleStartDate,
    saleEndDate: payload.saleEndDate,
    finalPrice: isSale ? salePrice : price,
    isSale,
    isBestSeller: payload.isBestSeller ?? false,
    isNewArrival: payload.isNewArrival ?? true,
    isSoldOut: false,
    soldItems: 0,
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

function readBool(v: string | null): boolean | undefined {
  if (v === null) return undefined;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

export const productsHandlers = [
  http.get(`${API}/product/get-all-products`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const category = url.searchParams.get('category');
    const subCategory = url.searchParams.get('subCategory');
    const isSale = readBool(url.searchParams.get('isSale'));
    const isNewArrival = readBool(url.searchParams.get('isNewArrival'));
    const isBestSeller = readBool(url.searchParams.get('isBestSeller'));
    const isSoldOut = readBool(url.searchParams.get('isSoldOut'));
    const isDeleted = readBool(url.searchParams.get('isDeleted'));

    let products = Array.from(store.values()).filter((p) =>
      isDeleted ? p.isDeleted : !p.isDeleted
    );
    if (category) products = products.filter((p) => p.category === category);
    if (subCategory) products = products.filter((p) => p.subCategory === subCategory);
    if (isSale === true) products = products.filter((p) => p.isSale);
    if (isNewArrival === true) products = products.filter((p) => p.isNewArrival);
    if (isBestSeller === true) products = products.filter((p) => p.isBestSeller);
    if (isSoldOut === true) products = products.filter((p) => p.isSoldOut);

    return HttpResponse.json({
      statusCode: 200,
      data: {
        products,
        currentPage: page,
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

  http.get(`${API}/product/get-analysis`, () => {
    const products = Array.from(store.values());
    const soldOut = products.filter((p) => p.isSoldOut).length;
    const analysis: ApiProductAnalysis = {
      products: {
        total: products.length,
        soldOut,
        topSelling: [],
        mostWishlisted: [],
        totalFinalPrice: products.reduce((acc, p) => acc + (p.finalPrice ?? p.price), 0),
        totalWholesalePrice: products.reduce((acc, p) => acc + p.wholesalePrice, 0),
      },
      categories: { total: 0, subCategories: 0 },
      orders: {
        total: 0,
        todaySales: 0,
        todayOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        byStatus: {},
        last7Days: [],
      },
      customers: { total: 0 },
    };
    return HttpResponse.json({
      statusCode: 200,
      data: { analysis },
      message: 'OK',
      success: true,
    });
  }),
];
