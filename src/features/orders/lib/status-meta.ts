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
  ordered: {
    label: 'Ordered',
    icon: ShoppingBag,
    description: 'Customer placed the order.',
  },
  confirmed: {
    label: 'Confirmed',
    icon: Check,
    description: 'Order confirmed by admin.',
  },
  under_review: {
    label: 'Under review',
    icon: Eye,
    description: 'Reviewing details before dispatch.',
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
  { value: 'ordered', label: 'Ordered' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'deleted', label: 'Deleted' },
];

export const ORDER_STEPPER_STATUSES: OrderStatus[] = [
  'ordered',
  'confirmed',
  'under_review',
  'shipped',
  'delivered',
];
