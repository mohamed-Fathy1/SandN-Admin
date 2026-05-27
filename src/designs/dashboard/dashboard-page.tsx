import { lazy, Suspense, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowUpRight,
  Megaphone,
  Package,
  RefreshCw,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import {
  AdminTable,
  Button,
  Card,
  EmptyState,
  FadeUp,
  PageTransition,
  QueryErrorState,
  Skeleton,
  StatusBadge,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useProductAnalysis } from '@/features/products/hooks/use-products';
import { useCategories } from '@/features/catalog/categories/hooks/use-categories';
import { useOffers } from '@/features/offers/hooks/use-offers';
import { useOrders, useOrdersByStatusCounts } from '@/features/orders/hooks/use-orders';
import { ORDER_STATUSES, ROUTES, type OrderStatus } from '@/config/constants';
import { ORDER_STATUS_META } from '@/features/orders/lib/status-meta';
import { formatDateTime, formatEGP, formatNumber } from '@/shared/utils/format';
import type { ApiOrder } from '@/shared/types/api';
import type { ColumnDef } from '@tanstack/react-table';

const OrdersByStatusChart = lazy(() => import('./orders-by-status-chart'));

const HOUR_GREETING = (() => {
  const h = new Date().getHours();
  if (h < 5) return 'Late evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late evening';
})();

export function DashboardPage() {
  return (
    <PageTransition>
      <PageHeader
        eyebrow={HOUR_GREETING}
        title="The storefront, at a glance."
        subtitle="A daily pulse of inventory, orders, and the things customers love."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FadeUp delay={0}>
          <TotalProductsCard />
        </FadeUp>
        <FadeUp delay={0.06}>
          <PendingOrdersCard />
        </FadeUp>
        <FadeUp delay={0.12}>
          <ActiveOffersCard />
        </FadeUp>
        <FadeUp delay={0.18}>
          <TotalCategoriesCard />
        </FadeUp>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FadeUp delay={0.24} className="lg:col-span-2">
          <RecentOrdersCard />
        </FadeUp>
        <FadeUp delay={0.3}>
          <OrdersByStatusCard />
        </FadeUp>
      </div>
    </PageTransition>
  );
}

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  value?: string;
  helperHref?: string;
  helperLabel?: string;
  helperSearch?: Record<string, unknown>;
}

function KpiCard({
  label,
  icon: Icon,
  isPending,
  isError,
  onRetry,
  value,
  helperHref,
  helperLabel = 'Manage',
  helperSearch,
}: KpiCardProps) {
  return (
    <Card padding="none" className="group overflow-hidden">
      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </span>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
          >
            <Icon size={15} strokeWidth={1.75} />
          </span>
        </div>

        <div className="mt-3 flex-1">
          {isPending ? (
            <Skeleton className="h-9 w-20" />
          ) : isError ? (
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl italic tabular-nums text-muted-foreground">
                —
              </span>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw size={11} strokeWidth={1.75} aria-hidden />
                <span>Retry</span>
                <span className="sr-only">loading {label}</span>
              </button>
            </div>
          ) : (
            <span className="font-display text-[2rem] italic leading-none tabular-nums text-foreground">
              {value ?? '—'}
            </span>
          )}
        </div>

        {helperHref ? (
          <Link
            to={helperHref as never}
            search={helperSearch as never}
            className="group/helper mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border-medium px-4 text-xs font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {helperLabel}
            <ArrowUpRight
              size={12}
              strokeWidth={2}
              aria-hidden
              className="transition-transform motion-safe:group-hover/helper:translate-x-0.5 motion-safe:group-hover/helper:-translate-y-0.5"
            />
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

function TotalProductsCard() {
  const q = useProductAnalysis();
  return (
    <KpiCard
      label="Total products"
      icon={Package}
      isPending={q.isPending}
      isError={q.isError}
      onRetry={() => q.refetch()}
      value={q.data ? formatNumber(q.data.total) : undefined}
      helperHref={ROUTES.products}
      helperSearch={{ page: 1, search: '' }}
    />
  );
}

function PendingOrdersCard() {
  const q = useOrders({ page: 1, status: 'ordered' });
  const count = q.data?.totalItems ?? 0;
  return (
    <KpiCard
      label="Pending orders"
      icon={ShoppingBag}
      isPending={q.isPending}
      isError={q.isError}
      onRetry={() => q.refetch()}
      value={q.data ? formatNumber(count) : undefined}
      helperHref={ROUTES.orders}
      helperLabel="Review"
      helperSearch={{ page: 1, status: 'ordered' }}
    />
  );
}

function ActiveOffersCard() {
  const q = useOffers();
  const active = useMemo(() => (q.data ?? []).filter((o) => o.isActive).length, [q.data]);
  return (
    <KpiCard
      label="Active offers"
      icon={Megaphone}
      isPending={q.isPending}
      isError={q.isError}
      onRetry={() => q.refetch()}
      value={q.data ? formatNumber(active) : undefined}
      helperHref={ROUTES.offers}
    />
  );
}

function TotalCategoriesCard() {
  const q = useCategories();
  return (
    <KpiCard
      label="Categories"
      icon={Tag}
      isPending={q.isPending}
      isError={q.isError}
      onRetry={() => q.refetch()}
      value={q.data ? formatNumber(q.data.length) : undefined}
      helperHref={ROUTES.categories}
    />
  );
}

function RecentOrdersCard() {
  const q = useOrders({ page: 1 });
  const recent = (q.data?.orders ?? []).slice(0, 6);

  const columns = useMemo<ColumnDef<ApiOrder>[]>(
    () => [
      {
        id: 'orderNumber',
        header: 'Order #',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            to={ROUTES.orderDetail(row.original._id)}
            className="font-mono text-xs text-accent hover:underline"
          >
            {row.original.orderNumber}
          </Link>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        enableSorting: false,
        cell: ({ row }) => {
          const info = row.original.customerInfo;
          const name = `${info?.firstName ?? ''} ${info?.lastName ?? ''}`.trim();
          return <span className="text-foreground">{name || '—'}</span>;
        },
      },
      {
        id: 'total',
        header: 'Total',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-foreground">
            {formatEGP(row.original.total)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
      },
      {
        id: 'when',
        header: 'When',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
    ],
    []
  );

  return (
    <Card padding="none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h2 className="m-0 font-display text-xl italic text-foreground">Recent orders</h2>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Latest activity
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.orders} search={{ page: 1 }}>
            View all
            <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
          </Link>
        </Button>
      </div>

      {q.isPending ? (
        <div className="space-y-2 px-6 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="px-6 py-4">
          <QueryErrorState error={q.error} onRetry={() => q.refetch()} />
        </div>
      ) : recent.length === 0 ? (
        <div className="px-6 py-4">
          <EmptyState
            title="No orders yet"
            description="When customers place orders, they'll show up here."
          />
        </div>
      ) : (
        <AdminTable
          data={recent}
          columns={columns}
          getRowId={(o) => o._id}
          className="rounded-none border-0 shadow-none"
        />
      )}
    </Card>
  );
}

function OrdersByStatusCard() {
  const queries = useOrdersByStatusCounts();

  const counts: Array<{ status: OrderStatus; count: number; isPending: boolean; isError: boolean }> =
    ORDER_STATUSES.map((status, idx) => {
      const r = queries[idx];
      const count = r.data?.totalItems ?? 0;
      return { status, count, isPending: r.isPending, isError: r.isError };
    });

  const chartData = counts.map((c) => ({
    status: c.status,
    label: ORDER_STATUS_META[c.status].label,
    count: c.isPending || c.isError ? 0 : c.count,
  }));
  const allPending = counts.every((c) => c.isPending);
  const hasError = counts.some((c) => c.isError);

  return (
    <Card>
      <div className="mb-2">
        <h2 className="m-0 font-display text-xl italic text-foreground">By status</h2>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Order distribution
        </p>
      </div>
      {allPending ? (
        <Skeleton className="mt-4 h-48 w-full" />
      ) : hasError ? (
        <p className="mt-4 text-sm text-muted-foreground">Could not load status breakdown.</p>
      ) : (
        <div className="mt-4">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <OrdersByStatusChart data={chartData} />
          </Suspense>
        </div>
      )}
    </Card>
  );
}
