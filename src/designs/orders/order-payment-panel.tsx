import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RotateCcw } from 'lucide-react';
import {
  AdminFormField,
  AdminImageUploader,
  Button,
  Card,
  FormSheet,
  GenericBadge,
  NumberInput,
  Select,
  Textarea,
  Thumbnail,
  type SelectOption,
} from '@/designs/shared';
import { PaymentStatusBadge } from './payment-status-badge';
import {
  useRecordOrderPayment,
  useRecordOrderRefund,
} from '@/features/orders/hooks/use-orders';
import {
  makePaymentFormSchema,
  refundFormSchema,
} from '@/features/orders/schemas/payment-form';
import {
  PAYMENT_LOCKED_STATUSES,
  PAYMENT_METHOD_LABEL_KEY,
  PAYMENT_TXN_TYPE_META,
} from '@/features/orders/lib/payment-meta';
import { PAYMENT_METHODS, type PaymentMethod } from '@/config/constants';
import { ApiError } from '@/shared/lib/axios';
import { mapApiErrorsToFields } from '@/shared/utils/forms';
import { formatEGP, formatDateTime } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { ApiOrder, PaymentTransaction } from '@/shared/types/api';

interface OrderPaymentPanelProps {
  order: ApiOrder;
}

export function OrderPaymentPanel({ order }: OrderPaymentPanelProps) {
  const { t } = useTranslation('orders');
  const [recordOpen, setRecordOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const { payment, remainingAmount } = order;
  const orderOffPath = order.status === 'cancelled' || order.status === 'deleted';
  const canRecordPayment =
    !PAYMENT_LOCKED_STATUSES.includes(payment.status) && !orderOffPath;
  const canRefund = payment.status === 'refund_pending';

  return (
    <Card padding="none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <h2 className="m-0 text-eyebrow text-muted-foreground">{t('payment.title')}</h2>
          <PaymentStatusBadge status={payment.status} size="sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canRecordPayment ? (
            <Button size="sm" onClick={() => setRecordOpen(true)}>
              <Plus size={14} strokeWidth={1.5} aria-hidden />
              {t('payment.actions.recordPayment')}
            </Button>
          ) : null}
          {canRefund ? (
            <Button size="sm" variant="secondary" onClick={() => setRefundOpen(true)}>
              <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
              {t('payment.actions.recordRefund')}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
        <Stat label={t('payment.panel.total')} value={formatEGP(order.total)} />
        <Stat label={t('payment.panel.collected')} value={formatEGP(payment.totalCollected)} />
        <Stat
          label={t('payment.panel.remaining')}
          value={formatEGP(remainingAmount)}
          emphasis
        />
      </div>

      <PaymentLedger transactions={payment.transactions} />

      <RecordPaymentSheet
        key={recordOpen ? 'record-open' : 'record-closed'}
        order={order}
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
      />
      <RecordRefundSheet
        key={refundOpen ? 'refund-open' : 'refund-closed'}
        order={order}
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
      />
    </Card>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums sm:text-xl',
          emphasis ? 'text-accent' : 'text-foreground'
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ─────────────────────────── Ledger ─────────────────────────── */

function PaymentLedger({ transactions }: { transactions: PaymentTransaction[] }) {
  const { t } = useTranslation('orders');

  if (transactions.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">
        {t('payment.ledger.empty')}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {transactions.map((tx, idx) => {
        const meta = PAYMENT_TXN_TYPE_META[tx.type] ?? PAYMENT_TXN_TYPE_META.deposit;
        const receiptUrl = tx.receiptImage?.mediaUrl;
        return (
          <li
            key={`${tx.type}-${tx.recordedAt}-${idx}`}
            className="flex items-start gap-3 px-5 py-3.5 sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <GenericBadge label={t(meta.labelKey)} tone={meta.tone} icon={meta.icon} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {t(PAYMENT_METHOD_LABEL_KEY[tx.method] ?? 'payment.method.other')}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(tx.recordedAt)}</p>
              {tx.note ? (
                <p className="mt-1 break-words text-xs text-foreground">{tx.note}</p>
              ) : null}
            </div>

            {receiptUrl ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t('payment.ledger.viewReceipt')}
                className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Thumbnail src={receiptUrl} size="sm" alt={t('payment.ledger.receipt')} />
              </a>
            ) : null}

            <p
              className={cn(
                'shrink-0 self-center text-sm font-semibold tabular-nums sm:text-base',
                meta.sign < 0 ? 'text-status-cancelled' : 'text-foreground'
              )}
            >
              {meta.sign < 0 ? '− ' : '+ '}
              {formatEGP(Math.abs(tx.amount))}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────────────────── Shared method select ─────────────────────── */

function useMethodOptions(): ReadonlyArray<SelectOption<PaymentMethod>> {
  const { t } = useTranslation('orders');
  return useMemo(
    () => PAYMENT_METHODS.map((m) => ({ value: m, label: t(PAYMENT_METHOD_LABEL_KEY[m]) })),
    [t]
  );
}

/* ─────────────────────── Record payment sheet ─────────────────────── */

interface SheetProps {
  order: ApiOrder;
  open: boolean;
  onClose: () => void;
}

interface PaymentErrors {
  amount?: string;
  method?: string;
  form?: string;
}

function RecordPaymentSheet({ order, open, onClose }: SheetProps) {
  const { t } = useTranslation('orders');
  const { t: tCommon } = useTranslation('common');
  const methodOptions = useMethodOptions();
  const record = useRecordOrderPayment();

  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<PaymentMethod>('instapay');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState('');
  const [errors, setErrors] = useState<PaymentErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = makePaymentFormSchema(order.remainingAmount).safeParse({
      amount: amount === '' ? Number.NaN : amount,
      method,
      note: note.trim() || undefined,
      receiptImageUrl: receipt || undefined,
    });
    if (!parsed.success) {
      const next: PaymentErrors = {};
      parsed.error.issues.forEach((iss) => {
        const head = iss.path[0];
        if (head === 'amount' && !next.amount) next.amount = iss.message;
        else if (head === 'method' && !next.method) next.method = iss.message;
      });
      setErrors(next);
      return;
    }

    record.mutate(
      {
        id: order._id,
        body: {
          amount: parsed.data.amount,
          method: parsed.data.method,
          ...(parsed.data.note ? { note: parsed.data.note } : {}),
          ...(parsed.data.receiptImageUrl ? { receiptImageUrl: parsed.data.receiptImageUrl } : {}),
        },
      },
      {
        onSuccess: onClose,
        onError: (err) => setErrors(routeServerError(err)),
      }
    );
  };

  return (
    <FormSheetShell
      open={open}
      onClose={onClose}
      title={t('payment.recordSheet.title')}
      description={t('payment.recordSheet.description')}
      isPending={record.isPending}
      submitLabel={t('payment.recordSheet.submit')}
      onSubmit={handleSubmit}
    >
      {errors.form ? <FormBanner message={errors.form} /> : null}

      <AdminFormField
        label={t('payment.recordSheet.amount')}
        required
        error={errors.amount}
        hint={t('payment.recordSheet.amountHint', { value: formatEGP(order.remainingAmount) })}
      >
        <NumberInput
          value={amount}
          onChange={setAmount}
          suffix={tCommon('currencySuffix')}
          clampMin={0}
          clampMax={order.remainingAmount}
          hasError={Boolean(errors.amount)}
          disabled={record.isPending}
          placeholder="0"
        />
      </AdminFormField>

      <AdminFormField label={t('payment.recordSheet.method')} required error={errors.method}>
        <Select<PaymentMethod>
          value={method}
          onValueChange={setMethod}
          options={methodOptions}
          disabled={record.isPending}
          hasError={Boolean(errors.method)}
        />
      </AdminFormField>

      <AdminFormField label={t('payment.recordSheet.note')}>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={record.isPending}
          placeholder={t('payment.recordSheet.notePlaceholder')}
        />
      </AdminFormField>

      <AdminFormField label={t('payment.recordSheet.receipt')}>
        <AdminImageUploader
          folder="PaymentReceipts"
          value={receipt || undefined}
          onChange={setReceipt}
          onClear={() => setReceipt('')}
          disabled={record.isPending}
          aspectRatio="4 / 3"
        />
      </AdminFormField>
    </FormSheetShell>
  );
}

/* ─────────────────────── Record refund sheet ─────────────────────── */

interface RefundErrors {
  method?: string;
  form?: string;
}

function RecordRefundSheet({ order, open, onClose }: SheetProps) {
  const { t } = useTranslation('orders');
  const methodOptions = useMethodOptions();
  const refund = useRecordOrderRefund();

  const [method, setMethod] = useState<PaymentMethod>('instapay');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState('');
  const [errors, setErrors] = useState<RefundErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = refundFormSchema.safeParse({
      method,
      note: note.trim() || undefined,
      receiptImageUrl: receipt || undefined,
    });
    if (!parsed.success) {
      const next: RefundErrors = {};
      parsed.error.issues.forEach((iss) => {
        if (iss.path[0] === 'method' && !next.method) next.method = iss.message;
      });
      setErrors(next);
      return;
    }

    refund.mutate(
      {
        id: order._id,
        body: {
          method: parsed.data.method,
          ...(parsed.data.note ? { note: parsed.data.note } : {}),
          ...(parsed.data.receiptImageUrl ? { receiptImageUrl: parsed.data.receiptImageUrl } : {}),
        },
      },
      {
        onSuccess: onClose,
        onError: (err) => setErrors(routeServerError(err)),
      }
    );
  };

  return (
    <FormSheetShell
      open={open}
      onClose={onClose}
      title={t('payment.refundSheet.title')}
      description={t('payment.refundSheet.description', {
        value: formatEGP(order.payment.totalCollected),
      })}
      isPending={refund.isPending}
      submitLabel={t('payment.refundSheet.submit')}
      onSubmit={handleSubmit}
    >
      {errors.form ? <FormBanner message={errors.form} /> : null}

      <AdminFormField label={t('payment.refundSheet.method')} required error={errors.method}>
        <Select<PaymentMethod>
          value={method}
          onValueChange={setMethod}
          options={methodOptions}
          disabled={refund.isPending}
          hasError={Boolean(errors.method)}
        />
      </AdminFormField>

      <AdminFormField label={t('payment.refundSheet.note')}>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={refund.isPending}
          placeholder={t('payment.refundSheet.notePlaceholder')}
        />
      </AdminFormField>

      <AdminFormField label={t('payment.refundSheet.receipt')}>
        <AdminImageUploader
          folder="PaymentReceipts"
          value={receipt || undefined}
          onChange={setReceipt}
          onClear={() => setReceipt('')}
          disabled={refund.isPending}
          aspectRatio="4 / 3"
        />
      </AdminFormField>
    </FormSheetShell>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

/**
 * Route a server error to inline fields: validation errors[] → field map;
 * "amount exceeds" → amount field; other business 400s → a form-level banner.
 * (The mutation hook also surfaces the message as a toast.)
 */
function routeServerError(err: unknown): PaymentErrors {
  const fieldMap = mapApiErrorsToFields(err);
  if (fieldMap) {
    const next: PaymentErrors = {};
    for (const [path, msg] of Object.entries(fieldMap)) {
      if (path === 'amount') next.amount = msg;
      else if (path === 'method') next.method = msg;
    }
    if (Object.keys(next).length > 0) return next;
  }
  if (err instanceof ApiError) {
    if (err.message.toLowerCase().includes('exceed')) return { amount: err.message };
    return { form: err.message };
  }
  return {};
}

function FormBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-status-cancelled-bg/50 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

interface FormSheetShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

function FormSheetShell({
  open,
  onClose,
  title,
  description,
  isPending,
  submitLabel,
  onSubmit,
  children,
}: FormSheetShellProps) {
  const { t: tCommon } = useTranslation('common');
  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={onSubmit} isLoading={isPending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {children}
      </form>
    </FormSheet>
  );
}
