import type { OrderStatus } from '@/config/constants';

/**
 * Forward transitions for an admin. Order of states per the API spec:
 *   under_review (initial) → confirmed → ordered → shipped → delivered
 * Cancelled/deleted are terminal and unreachable from the linear flow.
 */
const FORWARD_TRANSITION: Partial<Record<OrderStatus, OrderStatus>> = {
  under_review: 'confirmed',
  confirmed: 'ordered',
  ordered: 'shipped',
  shipped: 'delivered',
};

export function nextStatus(current: OrderStatus): OrderStatus | null {
  return FORWARD_TRANSITION[current] ?? null;
}

/** An order can be cancelled at any point before it's shipped. */
const CANCELLABLE: OrderStatus[] = ['under_review', 'confirmed', 'ordered'];

export function canCancel(current: OrderStatus): boolean {
  return CANCELLABLE.includes(current);
}

export function isTerminal(current: OrderStatus): boolean {
  return current === 'delivered' || current === 'cancelled' || current === 'deleted';
}
