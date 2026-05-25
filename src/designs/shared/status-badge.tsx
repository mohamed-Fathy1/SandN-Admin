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

const STATUS_META: Record<OrderStatus, { label: string; icon: LucideIcon; classes: string; ring: string }> = {
  ordered: {
    label: 'Ordered',
    icon: ShoppingBag,
    classes: 'bg-status-ordered-bg text-status-ordered',
    ring: 'ring-status-ordered/15',
  },
  confirmed: {
    label: 'Confirmed',
    icon: Check,
    classes: 'bg-status-confirmed-bg text-status-confirmed',
    ring: 'ring-status-confirmed/15',
  },
  under_review: {
    label: 'Under review',
    icon: Eye,
    classes: 'bg-status-under-review-bg text-status-under-review',
    ring: 'ring-status-under-review/15',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    classes: 'bg-status-shipped-bg text-status-shipped',
    ring: 'ring-status-shipped/15',
  },
  delivered: {
    label: 'Delivered',
    icon: PackageCheck,
    classes: 'bg-status-delivered-bg text-status-delivered',
    ring: 'ring-status-delivered/15',
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    classes: 'bg-status-cancelled-bg text-status-cancelled',
    ring: 'ring-status-cancelled/15',
  },
  deleted: {
    label: 'Deleted',
    icon: Trash2,
    classes: 'bg-status-deleted-bg text-status-deleted',
    ring: 'ring-status-deleted/15',
  },
};

type Tone = 'muted' | 'accent' | 'success' | 'warning' | 'destructive' | 'info';

const TONE_CLASSES: Record<Tone, string> = {
  muted: 'bg-muted text-muted-foreground ring-border-medium',
  accent: 'bg-accent-soft text-accent ring-accent/15',
  success: 'bg-status-delivered-bg text-status-delivered ring-status-delivered/15',
  warning: 'bg-status-under-review-bg text-status-under-review ring-status-under-review/15',
  destructive: 'bg-status-cancelled-bg text-status-cancelled ring-status-cancelled/15',
  info: 'bg-status-ordered-bg text-status-ordered ring-status-ordered/15',
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
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.classes,
        meta.ring,
        className
      )}
    >
      <Icon size={size === 'sm' ? 10 : 12} strokeWidth={2} aria-hidden />
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
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONE_CLASSES[tone],
        className
      )}
    >
      {Icon ? <Icon size={size === 'sm' ? 10 : 12} strokeWidth={2} aria-hidden /> : null}
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
