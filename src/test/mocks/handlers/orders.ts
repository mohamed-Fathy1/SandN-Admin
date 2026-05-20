import { http, HttpResponse } from 'msw';
import type { ApiOrder } from '@/shared/types/api';
import type { OrderStatus } from '@/config/constants';

const API = 'https://api.test.local';

function makeOrder(overrides: Partial<ApiOrder> = {}): ApiOrder {
  return {
    _id: 'ord-1',
    orderNumber: 'ORD-100',
    customer: 'cust-1',
    customerInfo: {
      firstName: 'Test',
      lastName: 'Customer',
      address: '12 Test St',
      shipping: { _id: 'ship-1', name: { en: 'Cairo', ar: 'القاهرة' }, cost: 75 },
      postalCode: '12345',
    },
    customerPhone: '01000000000',
    products: [],
    subtotal: 1000,
    shippingCost: 75,
    total: 1075,
    status: 'ordered',
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    ...overrides,
  };
}

const store = new Map<string, ApiOrder>([
  ['ord-1', makeOrder({ _id: 'ord-1', orderNumber: 'ORD-100', status: 'ordered' })],
  ['ord-2', makeOrder({ _id: 'ord-2', orderNumber: 'ORD-101', status: 'confirmed' })],
]);

export function resetOrdersStore() {
  store.clear();
  store.set('ord-1', makeOrder({ _id: 'ord-1', orderNumber: 'ORD-100', status: 'ordered' }));
  store.set(
    'ord-2',
    makeOrder({ _id: 'ord-2', orderNumber: 'ORD-101', status: 'confirmed' })
  );
}

export const ordersHandlers = [
  http.get(`${API}/order/admin/all`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as OrderStatus | null;
    const all = Array.from(store.values());
    const filtered = status ? all.filter((o) => o.status === status) : all;
    return HttpResponse.json({
      statusCode: 200,
      data: {
        orders: filtered,
        currentPage: 1,
        totalPages: 1,
        totalItems: filtered.length,
      },
      message: 'OK',
      success: true,
    });
  }),

  http.get(`${API}/order/admin/:id`, ({ params }) => {
    const id = String(params.id);
    const order = store.get(id);
    if (!order) {
      return HttpResponse.json(
        { statusCode: 404, success: false, message: 'Order not found', error: [] },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      data: { order },
      message: 'OK',
      success: true,
    });
  }),

  http.patch(`${API}/order/admin/status/:id`, async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { status: OrderStatus };
    const order = store.get(id);
    if (!order) {
      return HttpResponse.json(
        { statusCode: 404, success: false, message: 'Order not found', error: [] },
        { status: 404 }
      );
    }
    const updated: ApiOrder = { ...order, status: body.status };
    store.set(id, updated);
    return HttpResponse.json({
      statusCode: 200,
      data: { order: updated },
      message: 'OK',
      success: true,
    });
  }),

  http.patch(`${API}/order/admin/free-shipping/:id`, ({ params }) => {
    const id = String(params.id);
    const order = store.get(id);
    if (!order) {
      return HttpResponse.json(
        { statusCode: 404, success: false, message: 'Order not found', error: [] },
        { status: 404 }
      );
    }
    const updated: ApiOrder = {
      ...order,
      shippingCost: 0,
      total: order.subtotal - (order.discount ?? 0),
    };
    store.set(id, updated);
    return HttpResponse.json({
      statusCode: 200,
      data: { order: updated },
      message: 'OK',
      success: true,
    });
  }),
];
