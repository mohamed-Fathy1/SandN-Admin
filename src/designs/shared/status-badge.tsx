import {
  Check,
  CircleCheck,
  Clock,
  Eye,
  PackageCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { OrderStatus } from '@/config/constants';

const STATUS_META: Record<OrderStatus, { label: string; icon: LucideIcon; classes: string }> = {
  ordered: {
    label: 'Ordered',
    icon: ShoppingBag,
    classes: 'bg-status-ordered-bg text-status-ordered',
  },
  confirmed: {
    label: 'Confirmed',
    icon: Check,
    classes: 'bg-status-confirmed-bg text-status-confirmed',
  },
  under_review: {
    label: 'Under review',
    icon: Eye,
    classes: 'bg-status-under-review-bg text-status-under-review',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    classes: 'bg-status-shipped-bg text-status-shipped',
  },
  delivered: {
    label: 'Delivered',
    icon: PackageCheck,
    classes: 'bg-status-delivered-bg text-status-delivered',
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    classes: 'bg-status-cancelled-bg text-status-cancelled',
  },
  deleted: {
    label: 'Deleted',
    icon: Trash2,
    classes: 'bg-status-deleted-bg text-status-deleted',
  },
};

type Tone = 'muted' | 'accent' | 'success' | 'warning' | 'destructive' | 'info';

const TONE_CLASSES: Record<Tone, string> = {
  muted: 'bg-muted text-muted-foreground',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-status-delivered-bg text-status-delivered',
  warning: 'bg-status-under-review-bg text-status-under-review',
  destructive: 'bg-status-cancelled-bg text-status-cancelled',
  info: 'bg-status-ordered-bg text-status-ordered',
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.classes,
        className
      )}
    >
      <Icon size={size === 'sm' ? 10 : 12} strokeWidth={1.75} aria-hidden />
      {meta.label}
    </span>
  );
}

interface GenericBadgeProps {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  className?: string;
}

export function GenericBadge({
  label,
  tone = 'muted',
  size = 'md',
  icon: Icon,
  className,
}: GenericBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONE_CLASSES[tone],
        className
      )}
    >
      {Icon ? <Icon size={size === 'sm' ? 10 : 12} strokeWidth={1.75} aria-hidden /> : null}
      {label}
    </span>
  );
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <GenericBadge
      label={isActive ? 'Active' : 'Inactive'}
      tone={isActive ? 'success' : 'muted'}
      icon={isActive ? CircleCheck : Clock}
      size="sm"
    />
  );
}
