import {
  ArrowDownCircle,
  Banknote,
  RotateCcw,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { PaymentMethod, PaymentStatus, PaymentTxnType } from '@/config/constants';

/** Tones map to the shared `GenericBadge` palette (status-badge.tsx). */
type BadgeTone = 'muted' | 'accent' | 'success' | 'warning' | 'destructive' | 'info';

export interface PaymentStatusMeta {
  labelKey: string;
  tone: BadgeTone;
  icon: LucideIcon;
}

/** Single source of truth for payment-status label + color. Reuse everywhere. */
export const PAYMENT_STATUS_META: Record<PaymentStatus, PaymentStatusMeta> = {
  unpaid: { labelKey: 'payment.status.unpaid', tone: 'muted', icon: Wallet },
  partially_paid: {
    labelKey: 'payment.status.partially_paid',
    tone: 'warning',
    icon: ArrowDownCircle,
  },
  paid: { labelKey: 'payment.status.paid', tone: 'success', icon: Banknote },
  refund_pending: {
    labelKey: 'payment.status.refund_pending',
    tone: 'destructive',
    icon: RotateCcw,
  },
  refunded: { labelKey: 'payment.status.refunded', tone: 'info', icon: RotateCcw },
};

export const PAYMENT_METHOD_LABEL_KEY: Record<PaymentMethod, string> = {
  instapay: 'payment.method.instapay',
  vodafone_cash: 'payment.method.vodafone_cash',
  bank_transfer: 'payment.method.bank_transfer',
  cash: 'payment.method.cash',
  other: 'payment.method.other',
};

export interface PaymentTxnTypeMeta {
  labelKey: string;
  tone: BadgeTone;
  icon: LucideIcon;
  /** Refunds reduce the collected balance, so we render them as a negative. */
  sign: 1 | -1;
}

export const PAYMENT_TXN_TYPE_META: Record<PaymentTxnType, PaymentTxnTypeMeta> = {
  deposit: { labelKey: 'payment.txnType.deposit', tone: 'accent', icon: ArrowDownCircle, sign: 1 },
  balance_on_delivery: {
    labelKey: 'payment.txnType.balance_on_delivery',
    tone: 'info',
    icon: Truck,
    sign: 1,
  },
  refund: { labelKey: 'payment.txnType.refund', tone: 'destructive', icon: RotateCcw, sign: -1 },
};

/** Payment actions are blocked when settled, refunding, refunded, or the order is off-path. */
export const PAYMENT_LOCKED_STATUSES: PaymentStatus[] = ['paid', 'refund_pending', 'refunded'];
