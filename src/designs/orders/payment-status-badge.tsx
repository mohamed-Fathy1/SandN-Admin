import { useTranslation } from 'react-i18next';
import { GenericBadge } from '@/designs/shared';
import { PAYMENT_STATUS_META } from '@/features/orders/lib/payment-meta';
import type { PaymentStatus } from '@/config/constants';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
  className?: string;
}

/** Payment-status badge — single color/label source via PAYMENT_STATUS_META. */
export function PaymentStatusBadge({ status, size = 'md', className }: PaymentStatusBadgeProps) {
  const { t } = useTranslation('orders');
  const meta = PAYMENT_STATUS_META[status];
  if (!meta) return null;
  return (
    <GenericBadge
      label={t(meta.labelKey)}
      tone={meta.tone}
      icon={meta.icon}
      size={size}
      className={className}
    />
  );
}
