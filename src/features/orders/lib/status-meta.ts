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
  labelKey: string;
  icon: LucideIcon;
  descriptionKey: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  under_review: {
    labelKey: 'status.under_review',
    icon: Eye,
    descriptionKey: 'statusDescription.under_review',
  },
  confirmed: {
    labelKey: 'status.confirmed',
    icon: Check,
    descriptionKey: 'statusDescription.confirmed',
  },
  ordered: {
    labelKey: 'status.ordered',
    icon: ShoppingBag,
    descriptionKey: 'statusDescription.ordered',
  },
  shipped: {
    labelKey: 'status.shipped',
    icon: Truck,
    descriptionKey: 'statusDescription.shipped',
  },
  delivered: {
    labelKey: 'status.delivered',
    icon: PackageCheck,
    descriptionKey: 'statusDescription.delivered',
  },
  cancelled: {
    labelKey: 'status.cancelled',
    icon: X,
    descriptionKey: 'statusDescription.cancelled',
  },
  deleted: {
    labelKey: 'status.deleted',
    icon: Trash2,
    descriptionKey: 'statusDescription.deleted',
  },
};

export const ORDER_STATUS_TABS: { value: 'all' | OrderStatus; labelKey: string }[] = [
  { value: 'all', labelKey: 'tabs.all' },
  { value: 'under_review', labelKey: 'tabs.under_review' },
  { value: 'confirmed', labelKey: 'tabs.confirmed' },
  { value: 'ordered', labelKey: 'tabs.ordered' },
  { value: 'shipped', labelKey: 'tabs.shipped' },
  { value: 'delivered', labelKey: 'tabs.delivered' },
  { value: 'cancelled', labelKey: 'tabs.cancelled' },
  { value: 'deleted', labelKey: 'tabs.deleted' },
];

/** Linear stepper order per the API spec. */
export const ORDER_STEPPER_STATUSES: OrderStatus[] = [
  'under_review',
  'confirmed',
  'ordered',
  'shipped',
  'delivered',
];
