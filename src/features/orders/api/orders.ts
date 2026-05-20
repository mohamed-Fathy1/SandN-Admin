import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiOrder } from '@/shared/types/api';
import type { OrderStatus } from '@/config/constants';

export interface OrdersListResponse {
  orders: ApiOrder[];
  currentPage: number;
  totalPages: number;
  totalItems?: number;
}

interface OrderSingleResponse {
  order: ApiOrder;
}

export async function fetchOrders(params: {
  page: number;
  status?: OrderStatus;
}): Promise<OrdersListResponse> {
  const query: Record<string, string | number> = { page: params.page };
  if (params.status) query.status = params.status;
  const { data } = await api.get<ApiResponse<OrdersListResponse>>('/order/admin/all', {
    params: query,
  });
  return data.data;
}

export async function fetchOrder(id: string): Promise<ApiOrder> {
  const { data } = await api.get<ApiResponse<OrderSingleResponse>>(`/order/admin/${id}`);
  return data.data.order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ApiOrder> {
  const { data } = await api.patch<ApiResponse<OrderSingleResponse>>(
    `/order/admin/status/${id}`,
    { status }
  );
  return data.data.order;
}

export async function applyFreeShipping(id: string): Promise<ApiOrder> {
  const { data } = await api.patch<ApiResponse<OrderSingleResponse>>(
    `/order/admin/free-shipping/${id}`
  );
  return data.data.order;
}
