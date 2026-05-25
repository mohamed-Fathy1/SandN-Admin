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
          onBack={() => navigate({ to: ROUTES.orders, search: { page: 1, status: undefined } })}
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

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        breadcrumbLabel={`Order ${order.orderNumber}`}
        subtitle={`Placed ${formatDateTime(order.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.orders} search={{ page: 1 }}>
                <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
                All orders
              </Link>
            </Button>
            <StatusBadge status={order.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </h2>
            <StatusStepper currentStatus={order.status} />

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-5">
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
                <span className="text-sm text-muted-foreground">
                  Order is {ORDER_STATUS_META[order.status].label.toLowerCase()} — no further actions.
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
          </Card>

          <Card padding="none">
            <div className="border-b border-border px-6 py-4">
              <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Products
              </h2>
            </div>
            <ProductsTable products={order.products ?? []} />
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Summary
            </h2>
            <CostSummary order={order} />
          </Card>

          <Card>
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h2>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="font-medium text-foreground">
                {order.customerInfo?.firstName} {order.customerInfo?.lastName}
              </div>
              <div className="text-muted-foreground">{order.customerPhone ?? '—'}</div>
              {order.customerInfo?.email ? (
                <div className="text-muted-foreground">{order.customerInfo.email}</div>
              ) : null}
              {order.customerInfo?.additionalPhone ? (
                <div className="text-muted-foreground">
                  Alt: {order.customerInfo.additionalPhone}
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Shipping
            </h2>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="font-medium text-foreground">
                {nameOf(order.customerInfo?.shipping)}
              </div>
              <div className="text-muted-foreground">{order.customerInfo?.address}</div>
              {order.customerInfo?.apartmentSuite ? (
                <div className="text-muted-foreground">
                  {order.customerInfo.apartmentSuite}
                </div>
              ) : null}
              <div className="text-muted-foreground">
                Postal code: {order.customerInfo?.postalCode || '—'}
              </div>
            </div>
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
    </>
  );
}

function StatusStepper({ currentStatus }: { currentStatus: ApiOrder['status'] }) {
  const offPath = currentStatus === 'cancelled' || currentStatus === 'deleted';
  const currentIdx = ORDER_STEPPER_STATUSES.indexOf(currentStatus);

  return (
    <div className="mt-4">
      <ol className="grid grid-cols-5 gap-2">
        {ORDER_STEPPER_STATUSES.map((status, idx) => {
          const meta = ORDER_STATUS_META[status];
          const Icon = meta.icon;
          const reached = !offPath && currentIdx >= idx;
          const current = !offPath && currentIdx === idx;
          return (
            <li key={status} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                  reached
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-muted text-light-foreground'
                )}
              >
                <Icon size={14} strokeWidth={1.75} aria-hidden />
              </span>
              <span
                className={cn(
                  'text-[11px] leading-tight',
                  current && 'font-semibold text-foreground',
                  !current && reached && 'text-foreground',
                  !reached && 'text-light-foreground'
                )}
              >
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>
      {offPath ? (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-status-cancelled bg-status-cancelled-bg/40 px-4 py-2.5">
          <StatusBadge status={currentStatus} size="sm" />
          <span className="text-xs text-muted-foreground">
            {ORDER_STATUS_META[currentStatus].description}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ProductsTable({ products }: { products: ApiOrderProduct[] }) {
  if (products.length === 0) {
    return <div className="px-6 py-6 text-sm text-muted-foreground">No products on this order.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-6 py-3 text-left font-semibold">Product</th>
            <th className="px-6 py-3 text-left font-semibold">Variant</th>
            <th className="px-6 py-3 text-right font-semibold">Qty</th>
            <th className="px-6 py-3 text-right font-semibold">Price</th>
            <th className="px-6 py-3 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((p, idx) => {
            const productName =
              p.name?.en ?? (typeof p.productId === 'object' ? toEN(p.productId.name) : '—');
            const imageMedia =
              p.image ?? (typeof p.productId === 'object' ? p.productId.defaultImage : undefined);
            const imageUrl =
              typeof imageMedia === 'string' ? imageMedia : imageMedia?.mediaUrl;
            return (
              <tr key={`${idOf(p.productId)}-${idOf(p.variantId)}-${idx}`}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Thumbnail src={imageUrl} size="sm" />
                    <span className="font-medium text-foreground">{productName}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-muted-foreground">
                  {[p.size, p.color].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="px-6 py-3 text-right tabular-nums">{p.quantity}</td>
                <td className="px-6 py-3 text-right tabular-nums">{formatEGP(p.price)}</td>
                <td className="px-6 py-3 text-right tabular-nums font-medium">
                  {formatEGP(p.price * p.quantity)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CostSummary({ order }: { order: ApiOrder }) {
  return (
    <dl className="mt-3 space-y-2 text-sm">
      <Row label="Subtotal" value={formatEGP(order.subtotal)} />
      <Row label="Shipping" value={formatEGP(order.shippingCost)} />
      {order.discount && order.discount > 0 ? (
        <Row label="Discount" value={`− ${formatEGP(order.discount)}`} tone="muted" />
      ) : null}
      <div className="border-t border-border pt-2">
        <Row label="Total" value={formatEGP(order.total)} tone="strong" />
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
  tone?: 'muted' | 'strong';
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'tabular-nums',
          tone === 'strong'
            ? 'text-base font-semibold text-foreground'
            : tone === 'muted'
              ? 'text-muted-foreground'
              : 'text-foreground'
        )}
      >
        {value}
      </dd>
    </div>
  );
}
