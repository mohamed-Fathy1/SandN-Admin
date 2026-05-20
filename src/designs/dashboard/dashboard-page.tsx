import { Link } from '@tanstack/react-router';
import { useQueries } from '@tanstack/react-query';
import {
  ArrowRight,
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
  QueryErrorState,
  Skeleton,
  StatusBadge,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useProductAnalysis } from '@/features/products/hooks/use-products';
import { useCategories } from '@/features/catalog/categories/hooks/use-categories';
import { useOffers } from '@/features/offers/hooks/use-offers';
import { useOrders } from '@/features/orders/hooks/use-orders';
import { fetchOrders } from '@/features/orders/api/orders';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { ORDER_STATUSES, ROUTES, type OrderStatus } from '@/config/constants';
import { ORDER_STATUS_META } from '@/features/orders/lib/status-meta';
import { formatDateTime, formatEGP, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { ApiOrder } from '@/shared/types/api';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Pulse of the storefront at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TotalProductsCard />
        <PendingOrdersCard />
        <ActiveOffersCard />
        <TotalCategoriesCard />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrdersCard />
        </div>
        <OrdersByStatusCard />
      </div>
    </>
  );
}

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  value?: string;
  helper?: React.ReactNode;
}

function KpiCard({ label, icon: Icon, isPending, isError, onRetry, value, helper }: KpiCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon size={14} strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      <div className="mt-4">
        {isPending ? (
          <Skeleton className="h-9 w-24" />
        ) : isError ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums text-muted-foreground">—</span>
            <button
              type="button"
              onClick={onRetry}
              aria-label={`Retry loading ${label}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw size={12} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        ) : (
          <span className="font-display text-3xl italic tabular-nums text-foreground">
            {value ?? '—'}
          </span>
        )}
      </div>

      {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
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
      helper={
        <Link
          to={ROUTES.products}
          search={{ page: 1, search: '' }}
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          Manage <ArrowRight size={11} strokeWidth={1.75} aria-hidden />
        </Link>
      }
    />
  );
}

function PendingOrdersCard() {
  const q = useOrders({ page: 1, status: 'ordered' });
  const count = q.data?.totalItems ?? q.data?.orders?.length ?? 0;
  return (
    <KpiCard
      label="Pending orders"
      icon={ShoppingBag}
      isPending={q.isPending}
      isError={q.isError}
      onRetry={() => q.refetch()}
      value={q.data ? formatNumber(count) : undefined}
      helper={
        <Link
          to={ROUTES.orders}
          search={{ page: 1, status: 'ordered' }}
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          Review <ArrowRight size={11} strokeWidth={1.75} aria-hidden />
        </Link>
      }
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
      helper={
        <Link to={ROUTES.offers} className="inline-flex items-center gap-1 text-accent hover:underline">
          Manage <ArrowRight size={11} strokeWidth={1.75} aria-hidden />
        </Link>
      }
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
      helper={
        <Link
          to={ROUTES.categories}
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          Manage <ArrowRight size={11} strokeWidth={1.75} aria-hidden />
        </Link>
      }
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
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent orders
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.orders} search={{ page: 1 }}>
            View all
            <ArrowRight size={12} strokeWidth={1.75} aria-hidden />
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
  const queries = useQueries({
    queries: ORDER_STATUSES.map((status) => ({
      queryKey: adminQueryKeys.orders.list({ page: 1, status }),
      queryFn: () => fetchOrders({ page: 1, status }),
      staleTime: 30_000,
    })),
  });

  const counts: Array<{ status: OrderStatus; count: number; isPending: boolean; isError: boolean }> =
    ORDER_STATUSES.map((status, idx) => {
      const r = queries[idx];
      const count = r.data?.totalItems ?? r.data?.orders?.length ?? 0;
      return { status, count, isPending: r.isPending, isError: r.isError };
    });

  const max = Math.max(1, ...counts.map((c) => (c.isError ? 0 : c.count)));

  return (
    <Card>
      <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Orders by status
      </h2>
      <ul className="mt-4 space-y-3">
        {counts.map((c) => {
          const meta = ORDER_STATUS_META[c.status];
          const pct = c.isPending || c.isError ? 0 : (c.count / max) * 100;
          return (
            <li key={c.status} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <meta.icon size={11} strokeWidth={1.75} aria-hidden />
                  {meta.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {c.isPending ? '…' : c.isError ? '—' : formatNumber(c.count)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    c.isError ? 'bg-border-medium' : 'bg-accent'
                  )}
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
