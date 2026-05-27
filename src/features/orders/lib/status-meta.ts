import {
  Check,
  Eye,
  PackageCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { OrderStatus } from '@/config/constants';

export interface OrderStatusMeta {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  under_review: {
    label: 'Under review',
    icon: Eye,
    description: 'Initial state — awaiting admin review.',
  },
  confirmed: {
    label: 'Confirmed',
    icon: Check,
    description: 'Admin confirmed the order.',
  },
  ordered: {
    label: 'Ordered',
    icon: ShoppingBag,
    description: 'Order placed / processed for fulfillment.',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    description: 'Out for delivery.',
  },
  delivered: {
    label: 'Delivered',
    icon: PackageCheck,
    description: 'Customer received the order.',
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    description: 'Order was cancelled.',
  },
  deleted: {
    label: 'Deleted',
    icon: Trash2,
    description: 'Order is hidden.',
  },
};

export const ORDER_STATUS_TABS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'under_review', label: 'Under review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'deleted', label: 'Deleted' },
];

/** Linear stepper order per the API spec. */
export const ORDER_STEPPER_STATUSES: OrderStatus[] = [
  'under_review',
  'confirmed',
  'ordered',
  'shipped',
  'delivered',
];
