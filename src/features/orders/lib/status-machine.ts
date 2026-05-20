import type { OrderStatus } from '@/config/constants';

/**
 * Allowed forward transitions for an admin. Cancelled/deleted are terminal.
 */
const FORWARD_TRANSITION: Partial<Record<OrderStatus, OrderStatus>> = {
  ordered: 'confirmed',
  confirmed: 'under_review',
  under_review: 'shipped',
  shipped: 'delivered',
};

export function nextStatus(current: OrderStatus): OrderStatus | null {
  return FORWARD_TRANSITION[current] ?? null;
}

const CANCELLABLE: OrderStatus[] = ['ordered', 'confirmed', 'under_review'];

export function canCancel(current: OrderStatus): boolean {
  return CANCELLABLE.includes(current);
}

export function isTerminal(current: OrderStatus): boolean {
  return current === 'delivered' || current === 'cancelled' || current === 'deleted';
}
