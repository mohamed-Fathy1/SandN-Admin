import { http, HttpResponse } from 'msw';
import type { ApiOrder, OrderPayment, PaymentTransaction } from '@/shared/types/api';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/config/constants';

const API = 'https://api.test.local';

function emptyPayment(): OrderPayment {
  return { totalCollected: 0, status: 'unpaid', transactions: [] };
}

function paymentStatusFor(total: number, collected: number): PaymentStatus {
  if (collected <= 0) return 'unpaid';
  if (collected >= total) return 'paid';
  return 'partially_paid';
}

function makeOrder(overrides: Partial<ApiOrder> = {}): ApiOrder {
  const base: ApiOrder = {
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
    payment: emptyPayment(),
    remainingAmount: 1075,
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
  };
  const merged: ApiOrder = { ...base, ...overrides };
  // Keep remaining consistent with total/collected unless explicitly overridden.
  if (overrides.remainingAmount == null) {
    merged.remainingAmount = merged.total - merged.payment.totalCollected;
  }
  return merged;
}

function seedOrders(): Array<[string, ApiOrder]> {
  return [
    ['ord-1', makeOrder({ _id: 'ord-1', orderNumber: 'ORD-100', status: 'ordered' })],
    ['ord-2', makeOrder({ _id: 'ord-2', orderNumber: 'ORD-101', status: 'confirmed' })],
    // Cancelled order that held a 200 deposit → owes a refund.
    [
      'ord-3',
      makeOrder({
        _id: 'ord-3',
        orderNumber: 'ORD-102',
        status: 'cancelled',
        payment: {
          totalCollected: 200,
          status: 'refund_pending',
          transactions: [
            {
              amount: 200,
              type: 'deposit',
              method: 'instapay',
              recordedBy: 'admin-mock',
              recordedAt: '2026-05-01T11:00:00.000Z',
            },
          ],
        },
      }),
    ],
  ];
}

const store = new Map<string, ApiOrder>(seedOrders());

export function resetOrdersStore() {
  store.clear();
  for (const [id, order] of seedOrders()) store.set(id, order);
}

export const ordersHandlers = [
  http.get(`${API}/order/admin/all`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as OrderStatus | null;
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const all = Array.from(store.values());
    let filtered = status ? all.filter((o) => o.status === status) : all;
    if (search) {
      filtered = filtered.filter((o) => o.orderNumber.toLowerCase().includes(search));
    }
    return HttpResponse.json({
      statusCode: 200,
      data: {
        orders: filtered,
        currentPage: 1,
        totalPages: 1,
        totalItems: filtered.length,
        filters: { status: status ?? null, searchTerm: search || null },
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

  http.post(`${API}/order/admin/payment/:id`, async ({ params, request }) => {
    const id = String(params.id);
    const order = store.get(id);
    if (!order) {
      return HttpResponse.json(
        { statusCode: 404, success: false, message: 'Order not found', error: [] },
        { status: 404 }
      );
    }
    const body = (await request.json()) as {
      amount: number;
      method: PaymentMethod;
      note?: string;
      receiptImageUrl?: string;
    };
    const remaining = order.total - order.payment.totalCollected;
    if (body.amount > remaining) {
      return HttpResponse.json(
        {
          statusCode: 400,
          success: false,
          message: 'Payment amount exceeds the remaining order total',
          error: [],
        },
        { status: 400 }
      );
    }
    const txn: PaymentTransaction = {
      amount: body.amount,
      type: 'deposit',
      method: body.method,
      note: body.note,
      receiptImage: body.receiptImageUrl
        ? { mediaUrl: body.receiptImageUrl, mediaId: 'receipt-mock' }
        : undefined,
      recordedBy: 'admin-mock',
      recordedAt: '2026-05-02T10:00:00.000Z',
    };
    const totalCollected = order.payment.totalCollected + body.amount;
    const updated: ApiOrder = {
      ...order,
      payment: {
        totalCollected,
        status: paymentStatusFor(order.total, totalCollected),
        transactions: [...order.payment.transactions, txn],
      },
      remainingAmount: order.total - totalCollected,
    };
    store.set(id, updated);
    return HttpResponse.json({
      statusCode: 200,
      data: { order: updated },
      message: 'Payment recorded successfully',
      success: true,
    });
  }),

  http.post(`${API}/order/admin/refund/:id`, async ({ params, request }) => {
    const id = String(params.id);
    const order = store.get(id);
    if (!order) {
      return HttpResponse.json(
        { statusCode: 404, success: false, message: 'Order not found', error: [] },
        { status: 404 }
      );
    }
    if (order.payment.status !== 'refund_pending') {
      return HttpResponse.json(
        { statusCode: 400, success: false, message: 'This order has no pending refund', error: [] },
        { status: 400 }
      );
    }
    const body = (await request.json()) as {
      method: PaymentMethod;
      note?: string;
      receiptImageUrl?: string;
    };
    const txn: PaymentTransaction = {
      amount: order.payment.totalCollected,
      type: 'refund',
      method: body.method,
      note: body.note,
      recordedBy: 'admin-mock',
      recordedAt: '2026-05-03T10:00:00.000Z',
    };
    const updated: ApiOrder = {
      ...order,
      payment: {
        totalCollected: 0,
        status: 'refunded',
        transactions: [...order.payment.transactions, txn],
      },
      remainingAmount: order.total,
    };
    store.set(id, updated);
    return HttpResponse.json({
      statusCode: 200,
      data: { order: updated },
      message: 'Refund recorded successfully',
      success: true,
    });
  }),
];
