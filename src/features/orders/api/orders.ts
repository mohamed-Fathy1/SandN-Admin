import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type {
  ApiOrder,
  ApiOrderProduct,
  OrderPayment,
  PaymentTransaction,
} from '@/shared/types/api';
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentTxnType,
} from '@/config/constants';

export interface OrdersListResponse {
  orders: ApiOrder[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface RawOrdersListResponse {
  orders?: unknown[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
}

interface RawOrderSingleResponse {
  order?: unknown;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeProduct(raw: unknown): ApiOrderProduct {
  const p = (raw ?? {}) as Record<string, unknown>;
  const price = num(p.price ?? p.itemPrice, 0);
  return {
    ...(p as object),
    productId: p.productId as ApiOrderProduct['productId'],
    variantId: p.variantId as ApiOrderProduct['variantId'],
    quantity: num(p.quantity, 0),
    price,
    name: p.name as ApiOrderProduct['name'],
    image: p.image as ApiOrderProduct['image'],
    size: p.size as ApiOrderProduct['size'],
    color: p.color as ApiOrderProduct['color'],
  };
}

function normalizeTransaction(raw: unknown): PaymentTransaction {
  const tx = (raw ?? {}) as Record<string, unknown>;
  const receipt = tx.receiptImage as { mediaUrl?: unknown; mediaId?: unknown } | undefined;
  return {
    amount: num(tx.amount, 0),
    type: (tx.type as PaymentTxnType) ?? 'deposit',
    method: (tx.method as PaymentMethod) ?? 'other',
    note: typeof tx.note === 'string' ? tx.note : undefined,
    receiptImage:
      receipt && typeof receipt.mediaUrl === 'string'
        ? { mediaUrl: receipt.mediaUrl, mediaId: String(receipt.mediaId ?? '') }
        : undefined,
    recordedBy: String(tx.recordedBy ?? ''),
    recordedAt: String(tx.recordedAt ?? ''),
  };
}

/**
 * Build a guaranteed `payment` object + `remainingAmount` for any order, even
 * legacy ones that predate the feature (then payment defaults to unpaid/empty).
 * `remainingAmount` is trusted from the API when present; only derived as fallback.
 */
function normalizePayment(
  raw: unknown,
  total: number
): { payment: OrderPayment; remainingAmount: number } {
  const p = (raw ?? {}) as Record<string, unknown>;
  const totalCollected = num(p.totalCollected, 0);
  const status = (typeof p.status === 'string' ? p.status : 'unpaid') as PaymentStatus;
  const transactions = Array.isArray(p.transactions)
    ? p.transactions.map(normalizeTransaction)
    : [];
  return {
    payment: { totalCollected, status, transactions },
    remainingAmount: total - totalCollected,
  };
}

function normalizeOrder(raw: unknown): ApiOrder {
  const o = (raw ?? {}) as Record<string, unknown>;
  const customer = o.customer as { phone?: string } | string | undefined;
  const customerPhone =
    (typeof o.customerPhone === 'string' && o.customerPhone) ||
    (customer && typeof customer === 'object' ? customer.phone : undefined) ||
    undefined;

  const info = ((o.customerInfo as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  const topShipping = o.shipping as unknown;
  // If customerInfo.shipping is just an id but the top-level `shipping` is the resolved object, use the latter for display.
  const infoShipping =
    typeof info.shipping === 'string' && topShipping && typeof topShipping === 'object'
      ? topShipping
      : info.shipping;

  const products = Array.isArray(o.products) ? o.products.map(normalizeProduct) : [];

  const subtotal = num(o.subtotal ?? o.subTotal, 0);
  const total = num(o.total ?? o.totalAmount, 0);
  const shippingCost = num(
    o.shippingCost ??
      (topShipping && typeof topShipping === 'object'
        ? (topShipping as { cost?: unknown }).cost
        : undefined),
    0
  );

  const { payment, remainingAmount: derivedRemaining } = normalizePayment(o.payment, total);
  // Trust the API's `remainingAmount` when present; only fall back to the derived value.
  const remainingAmount = o.remainingAmount != null ? num(o.remainingAmount, derivedRemaining) : derivedRemaining;

  return {
    ...(o as object),
    _id: String(o._id ?? ''),
    orderNumber: String(o.orderNumber ?? ''),
    customer: typeof customer === 'string' ? customer : '',
    customerInfo: {
      ...(info as object),
      firstName: (info.firstName as string) ?? '',
      lastName: (info.lastName as string) ?? '',
      address: (info.address as string) ?? '',
      apartmentSuite: info.apartmentSuite as string | undefined,
      shipping: infoShipping as ApiOrder['customerInfo']['shipping'],
      postalCode: (info.postalCode as string) ?? '',
      additionalPhone: info.additionalPhone as string | undefined,
      email: info.email as string | undefined,
    },
    customerPhone,
    products,
    subtotal,
    shippingCost,
    discount: num(o.discount, 0),
    total,
    status: o.status as OrderStatus,
    payment,
    remainingAmount,
    createdAt: String(o.createdAt ?? ''),
    updatedAt: String(o.updatedAt ?? ''),
  } as ApiOrder;
}

export async function fetchOrders(params: {
  page: number;
  status?: OrderStatus;
  search?: string;
}): Promise<OrdersListResponse> {
  const query: Record<string, string | number> = { page: params.page };
  if (params.status) query.status = params.status;
  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) query.search = trimmedSearch;
  const { data } = await api.get<ApiResponse<RawOrdersListResponse>>('/order/admin/all', {
    params: query,
  });
  const payload = data.data ?? {};
  return {
    orders: Array.isArray(payload.orders) ? payload.orders.map(normalizeOrder) : [],
    currentPage: payload.currentPage ?? params.page,
    totalPages: payload.totalPages ?? 0,
    totalItems: payload.totalItems ?? 0,
  };
}

export async function fetchOrder(id: string): Promise<ApiOrder> {
  const { data } = await api.get<ApiResponse<RawOrderSingleResponse>>(`/order/admin/${id}`);
  return normalizeOrder(data.data?.order);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ApiOrder> {
  const { data } = await api.patch<ApiResponse<RawOrderSingleResponse>>(
    `/order/admin/status/${id}`,
    { status }
  );
  return normalizeOrder(data.data?.order);
}

export async function applyFreeShipping(id: string): Promise<ApiOrder> {
  const { data } = await api.patch<ApiResponse<RawOrderSingleResponse>>(
    `/order/admin/free-shipping/${id}`
  );
  return normalizeOrder(data.data?.order);
}

export interface RecordPaymentBody {
  amount: number;
  method: PaymentMethod;
  note?: string;
  receiptImageUrl?: string;
}

export async function recordOrderPayment(
  orderId: string,
  body: RecordPaymentBody
): Promise<ApiOrder> {
  const { data } = await api.post<ApiResponse<RawOrderSingleResponse>>(
    `/order/admin/payment/${orderId}`,
    body
  );
  return normalizeOrder(data.data?.order);
}

export interface RecordRefundBody {
  method: PaymentMethod;
  note?: string;
  receiptImageUrl?: string;
}

export async function recordOrderRefund(
  orderId: string,
  body: RecordRefundBody
): Promise<ApiOrder> {
  const { data } = await api.post<ApiResponse<RawOrderSingleResponse>>(
    `/order/admin/refund/${orderId}`,
    body
  );
  return normalizeOrder(data.data?.order);
}
