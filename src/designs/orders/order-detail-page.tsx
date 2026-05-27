import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Truck } from 'lucide-react';
import {
  Button,
  Card,
  ConfirmDialog,
  NotFoundState,
  QueryErrorState,
  StatusBadge,
  PageSkeleton,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import {
  useApplyFreeShipping,
  useOrder,
  useUpdateOrderStatus,
} from '@/features/orders/hooks/use-orders';
import {
  ORDER_STATUS_META,
  ORDER_STEPPER_STATUSES,
} from '@/features/orders/lib/status-meta';
import {
  canCancel,
  isTerminal,
  nextStatus,
} from '@/features/orders/lib/status-machine';
import { cn } from '@/shared/utils/cn';
import { formatDateTime, formatEGP } from '@/shared/utils/format';
import { idOf, nameOf } from '@/shared/utils/relations';
import { toEN } from '@/shared/utils/bilingual';
import { isNotFoundError } from '@/shared/lib/api-error';
import type { ApiOrder, ApiOrderProduct } from '@/shared/types/api';

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const navigate = useNavigate();
  const orderQuery = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();
  const freeShipping = useApplyFreeShipping();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (orderQuery.isPending) return <PageSkeleton />;
  if (orderQuery.isError) {
    if (isNotFoundError(orderQuery.error)) {
      return (
        <NotFoundState
          error={orderQuery.error}
          onBack={() =>
            navigate({
              to: ROUTES.orders,
              search: { page: 1, status: undefined, search: '' },
            })
          }
          backLabel="Back to orders"
        />
      );
    }
    return <QueryErrorState error={orderQuery.error} onRetry={() => orderQuery.refetch()} />;
  }
  if (!orderQuery.data) return <PageSkeleton />;

  const order = orderQuery.data;
  const next = nextStatus(order.status);
  const allowCancel = canCancel(order.status);
  const terminal = isTerminal(order.status);
  const hasShipping = (order.shippingCost ?? 0) > 0;
  const customerName =
    `${order.customerInfo?.firstName ?? ''} ${order.customerInfo?.lastName ?? ''}`.trim() || '—';
  const itemCount = order.products?.reduce((n, p) => n + (p.quantity ?? 0), 0) ?? 0;

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        breadcrumbLabel={`Order ${order.orderNumber}`}
        subtitle={`Placed ${formatDateTime(order.createdAt)}`}
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.orders} search={{ page: 1, search: '' }}>
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
              All orders
            </Link>
          </Button>
        }
      />

      <section
        className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-background to-muted motion-safe:animate-[fadeUp_.45s_cubic-bezier(.22,1,.36,1)]"
        style={{
          animationFillMode: 'both',
        }}
      >
        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-eyebrow text-muted-foreground">
                Order
              </p>
              <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-foreground tabular-nums sm:text-3xl">
                {order.orderNumber}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{formatDateTime(order.createdAt)}</span>
                <span aria-hidden className="text-light-foreground">·</span>
                <span className="text-foreground">{customerName}</span>
                <span aria-hidden className="text-light-foreground">·</span>
                <span>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-border/70 pt-6 sm:mt-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <p className="text-eyebrow text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-accent tabular-nums sm:text-3xl">
                {formatEGP(order.total)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {next ? (
                <Button
                  onClick={() => updateStatus.mutate({ id: order._id, status: next })}
                  isLoading={updateStatus.isPending}
                  disabled={updateStatus.isPending}
                >
                  {next === 'shipped' ? (
                    <Truck size={14} strokeWidth={1.5} aria-hidden />
                  ) : (
                    <Check size={14} strokeWidth={1.5} aria-hidden />
                  )}
                  Mark as {ORDER_STATUS_META[next].label.toLowerCase()}
                </Button>
              ) : terminal ? (
                <span className="text-sm italic text-muted-foreground">
                  No further actions.
                </span>
              ) : null}

              {hasShipping && !terminal ? (
                <Button
                  variant="secondary"
                  onClick={() => freeShipping.mutate(order._id)}
                  isLoading={freeShipping.isPending}
                  disabled={freeShipping.isPending}
                >
                  Apply free shipping
                </Button>
              ) : null}

              {allowCancel ? (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmCancel(true)}
                  disabled={updateStatus.isPending}
                >
                  Cancel order
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="m-0 text-eyebrow text-muted-foreground">
              Progress
            </h2>
            <StatusTimeline currentStatus={order.status} />
          </Card>

          <Card padding="none">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <h2 className="m-0 text-eyebrow text-muted-foreground">
                Products
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {itemCount} {itemCount === 1 ? 'unit' : 'units'}
              </span>
            </div>
            <ProductsList products={order.products ?? []} />
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <h2 className="m-0 text-eyebrow text-muted-foreground">
              Summary
            </h2>
            <CostSummary order={order} />
          </Card>

          <Card>
            <h2 className="m-0 text-eyebrow text-muted-foreground">
              Recipient
            </h2>
            <Recipient order={order} />
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancel order ${order.orderNumber}?`}
        description="The customer will not receive this order. This cannot be undone."
        variant="destructive"
        confirmLabel="Cancel order"
        isPending={updateStatus.isPending}
        onConfirm={() => {
          updateStatus.mutate(
            { id: order._id, status: 'cancelled' },
            { onSuccess: () => setConfirmCancel(false) }
          );
        }}
      />

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes fadeUp {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </>
  );
}

function StatusTimeline({ currentStatus }: { currentStatus: ApiOrder['status'] }) {
  const offPath = currentStatus === 'cancelled' || currentStatus === 'deleted';

  if (offPath) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-status-cancelled/40 bg-status-cancelled-bg/40 px-4 py-3">
        <StatusBadge status={currentStatus} size="sm" />
        <p className="text-sm text-muted-foreground">
          {ORDER_STATUS_META[currentStatus].description}
        </p>
      </div>
    );
  }

  const steps = ORDER_STEPPER_STATUSES;
  const currentIdx = steps.indexOf(currentStatus);
  const progressPct = steps.length > 1 ? (currentIdx / (steps.length - 1)) * 100 : 0;

  return (
    <div className="mt-5">
      {/* Desktop / tablet — horizontal */}
      <ol className="relative hidden sm:grid sm:grid-cols-5">
        <div
          aria-hidden
          className="absolute left-[10%] right-[10%] top-[18px] h-px bg-border"
        />
        <div
          aria-hidden
          className="absolute left-[10%] top-[18px] h-px bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `calc((100% - 20%) * ${progressPct / 100})` }}
        />
        {steps.map((status, idx) => {
          const meta = ORDER_STATUS_META[status];
          const Icon = meta.icon;
          const reached = currentIdx >= idx;
          const current = currentIdx === idx;
          return (
            <li key={status} className="relative flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  'relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border bg-card transition-colors',
                  reached
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border text-light-foreground',
                  current && 'ring-4 ring-accent/15'
                )}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden />
              </span>
              <span
                className={cn(
                  'leading-tight',
                  current
                    ? 'font-semibold text-foreground text-[12px]'
                    : reached
                      ? 'text-xs text-foreground'
                      : 'text-xs text-light-foreground'
                )}
              >
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile — vertical */}
      <ol className="relative space-y-3 sm:hidden">
        <div aria-hidden className="absolute left-[17px] top-3 bottom-3 w-px bg-border" />
        <div
          aria-hidden
          className="absolute left-[17px] top-3 w-px bg-accent transition-[height] duration-500 ease-out"
          style={{ height: `calc((100% - 24px) * ${progressPct / 100})` }}
        />
        {steps.map((status, idx) => {
          const meta = ORDER_STATUS_META[status];
          const Icon = meta.icon;
          const reached = currentIdx >= idx;
          const current = currentIdx === idx;
          return (
            <li key={status} className="relative flex items-center gap-3">
              <span
                className={cn(
                  'relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card transition-colors',
                  reached
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border text-light-foreground',
                  current && 'ring-4 ring-accent/15'
                )}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden />
              </span>
              <span
                className={cn(
                  'text-sm leading-tight',
                  current
                    ? 'font-semibold text-foreground'
                    : reached
                      ? 'text-foreground'
                      : 'text-light-foreground'
                )}
              >
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function normalizeSize(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    const o = v as { size?: unknown; name?: unknown };
    if (typeof o.size === 'string') return o.size;
    if (o.name) return typeof o.name === 'string' ? o.name : toEN(o.name as never);
  }
  return null;
}

function normalizeColor(v: unknown): { label: string; hex?: string } | null {
  if (!v) return null;
  if (typeof v === 'string') return { label: v };
  if (typeof v === 'object') {
    const o = v as { name?: unknown; hex?: unknown };
    const label =
      typeof o.name === 'string' ? o.name : o.name ? toEN(o.name as never) : '';
    if (!label) return null;
    return { label, hex: typeof o.hex === 'string' ? o.hex : undefined };
  }
  return null;
}

function ProductsList({ products }: { products: ApiOrderProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">
        No products on this order.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {products.map((p, idx) => {
        const productName =
          p.name?.en ?? (typeof p.productId === 'object' ? toEN(p.productId.name) : '—');
        const imageMedia =
          p.image ?? (typeof p.productId === 'object' ? p.productId.defaultImage : undefined);
        const imageUrl =
          typeof imageMedia === 'string' ? imageMedia : imageMedia?.mediaUrl;
        const sizeLabel = normalizeSize(p.size);
        const color = normalizeColor(p.color);
        const hasVariant = Boolean(sizeLabel || color);
        return (
          <li
            key={`${idOf(p.productId)}-${idOf(p.variantId)}-${idx}`}
            className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:gap-5 sm:px-6 sm:py-5"
          >
            <div className="shrink-0">
              <span className="block sm:hidden">
                <Thumbnail src={imageUrl} size="sm" />
              </span>
              <span className="hidden sm:block">
                <Thumbnail src={imageUrl} size="md" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground sm:text-base">
                {productName}
              </p>
              {hasVariant ? (
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  {sizeLabel ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                      Size {sizeLabel}
                    </span>
                  ) : null}
                  {color ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                      {color.hex ? (
                        <span
                          aria-hidden
                          className="inline-block h-2.5 w-2.5 rounded-full border border-border"
                          style={{ backgroundColor: color.hex }}
                        />
                      ) : null}
                      {color.label}
                    </span>
                  ) : null}
                </p>
              ) : null}
              <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                {p.quantity} × {formatEGP(p.price)}
              </p>
            </div>

            <p className="shrink-0 self-center text-base font-semibold tabular-nums text-foreground sm:text-lg">
              {formatEGP(p.price * p.quantity)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function CostSummary({ order }: { order: ApiOrder }) {
  return (
    <dl className="mt-4 space-y-2.5 text-sm">
      <Row label="Subtotal" value={formatEGP(order.subtotal)} />
      <Row label="Shipping" value={formatEGP(order.shippingCost)} />
      {order.discount && order.discount > 0 ? (
        <Row label="Discount" value={`− ${formatEGP(order.discount)}`} tone="muted" />
      ) : null}
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <dt className="text-eyebrow text-muted-foreground">
          Total
        </dt>
        <dd className="text-xl font-semibold tabular-nums text-accent sm:text-2xl">
          {formatEGP(order.total)}
        </dd>
      </div>
    </dl>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'muted';
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'tabular-nums',
          tone === 'muted' ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Recipient({ order }: { order: ApiOrder }) {
  const info = order.customerInfo;
  const name = `${info?.firstName ?? ''} ${info?.lastName ?? ''}`.trim() || '—';
  const phone = order.customerPhone ?? '—';
  const email = info?.email;
  const altPhone = info?.additionalPhone;
  const address = info?.address;
  const apt = info?.apartmentSuite;
  const region = nameOf(info?.shipping);
  const postal = info?.postalCode;

  return (
    <div className="mt-4 space-y-5 text-sm">
      <div className="space-y-3">
        <Field label="Name" value={name} />
        <Field label="Phone" value={phone} />
        {altPhone ? <Field label="Alt. phone" value={altPhone} /> : null}
        {email ? <Field label="Email" value={email} /> : null}
      </div>
      <div className="border-t border-border" />
      <div className="space-y-3">
        <Field label="Region" value={region || '—'} />
        <Field label="Address" value={address || '—'} />
        {apt ? <Field label="Apartment / suite" value={apt} /> : null}
        <Field label="Postal code" value={postal || '—'} mono />
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-eyebrow text-light-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-sm text-foreground break-words',
          mono && 'font-mono text-xs'
        )}
      >
        {value}
      </p>
    </div>
  );
}
