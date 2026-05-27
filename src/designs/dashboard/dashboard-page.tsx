import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowUpRight,
  Boxes,
  Coins,
  Crown,
  Heart,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  AdminTable,
  Button,
  Card,
  EmptyState,
  Eyebrow,
  FadeUp,
  MetricValue,
  NumericCell,
  PageTransition,
  QueryErrorState,
  Skeleton,
  StatusBadge,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { useProductAnalysis } from '@/features/products/hooks/use-products';
import { useOrders } from '@/features/orders/hooks/use-orders';
import { ORDER_STATUSES, ROUTES, type OrderStatus } from '@/config/constants';
import { ORDER_STATUS_META } from '@/features/orders/lib/status-meta';
import { formatDateTime, formatEGP, formatNumber } from '@/shared/utils/format';
import { toEN } from '@/shared/utils/bilingual';
import type {
  ApiOrder,
  ApiProductAnalysis,
  AnalysisTopSellingProduct,
  AnalysisWishlistedProduct,
} from '@/shared/types/api';
import type { ColumnDef } from '@tanstack/react-table';

const OrdersByStatusChart = lazy(() => import('./orders-by-status-chart'));
const Last7DaysChart = lazy(() => import('./last-7-days-chart'));

const HOUR_GREETING = (() => {
  const h = new Date().getHours();
  if (h < 5) return 'Late evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late evening';
})();

export function DashboardPage() {
  const analysisQuery = useProductAnalysis();

  return (
    <PageTransition>
      <PageHeader
        eyebrow={HOUR_GREETING}
        title="The storefront, at a glance."
        subtitle="A daily pulse of inventory, orders, and the things customers love."
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => analysisQuery.refetch()}
            isLoading={analysisQuery.isFetching}
          >
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
            Refresh
          </Button>
        }
      />

      {analysisQuery.isError ? (
        <Card padding="md" className="mb-6">
          <QueryErrorState
            error={analysisQuery.error}
            onRetry={() => analysisQuery.refetch()}
          />
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FadeUp delay={0} className="h-full">
          <KpiCard
            label="Today sales"
            icon={Coins}
            isPending={analysisQuery.isPending}
            value={
              analysisQuery.data ? formatEGP(analysisQuery.data.orders.todaySales) : undefined
            }
            helper="Captured today, all statuses."
          />
        </FadeUp>
        <FadeUp delay={0.06} className="h-full">
          <KpiCard
            label="Today orders"
            icon={ShoppingBag}
            isPending={analysisQuery.isPending}
            value={
              analysisQuery.data
                ? formatNumber(analysisQuery.data.orders.todayOrders)
                : undefined
            }
            helperHref={ROUTES.orders}
            helperLabel="Open orders"
            helperSearch={{ page: 1, search: '' }}
          />
        </FadeUp>
        <FadeUp delay={0.12} className="h-full">
          <KpiCard
            label="Total revenue"
            icon={TrendingUp}
            isPending={analysisQuery.isPending}
            value={
              analysisQuery.data ? formatEGP(analysisQuery.data.orders.totalRevenue) : undefined
            }
            helper="All-time, excluding cancellations."
          />
        </FadeUp>
        <FadeUp delay={0.18} className="h-full">
          <KpiCard
            label="Avg order value"
            icon={Sparkles}
            isPending={analysisQuery.isPending}
            value={
              analysisQuery.data
                ? formatEGP(analysisQuery.data.orders.averageOrderValue)
                : undefined
            }
            helper="Across all completed orders."
          />
        </FadeUp>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FadeUp delay={0.22} className="h-full">
          <KpiCard
            label="Products"
            icon={Package}
            isPending={analysisQuery.isPending}
            value={
              analysisQuery.data ? formatNumber(analysisQuery.data.products.total) : undefined
            }
            helper={
              analysisQuery.data
                ? `${formatNumber(analysisQuery.data.products.soldOut)} sold out`
                : undefined
            }
            helperHref={ROUTES.products}
            helperLabel="Manage"
            helperSearch={{ page: 1, search: '', tab: 'active', flags: [] }}
          />
        </FadeUp>
        <FadeUp delay={0.26} className="h-full">
          <KpiCard
            label="Categories"
            icon={Tag}
            isPending={analysisQuery.isPending}
            value={
              analysisQuery.data ? formatNumber(analysisQuery.data.categories.total) : undefined
            }
            helper={
              analysisQuery.data
                ? `${formatNumber(analysisQuery.data.categories.subCategories)} sub-categories`
                : undefined
            }
            helperHref={ROUTES.categories}
            helperLabel="Manage"
          />
        </FadeUp>
        <FadeUp delay={0.3} className="h-full">
          <KpiCard
            label="Customers"
            icon={Users}
            isPending={analysisQuery.isPending}
            value={
              analysisQuery.data ? formatNumber(analysisQuery.data.customers.total) : undefined
            }
            helper="Registered shoppers."
          />
        </FadeUp>
        <FadeUp delay={0.34} className="h-full">
          <InventoryValueCard analysis={analysisQuery.data} isPending={analysisQuery.isPending} />
        </FadeUp>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FadeUp delay={0.36} className="lg:col-span-2">
          <Last7DaysCard analysis={analysisQuery.data} isPending={analysisQuery.isPending} />
        </FadeUp>
        <FadeUp delay={0.4}>
          <OrdersByStatusCard analysis={analysisQuery.data} isPending={analysisQuery.isPending} />
        </FadeUp>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FadeUp delay={0.42}>
          <TopSellingCard
            products={analysisQuery.data?.products.topSelling ?? []}
            isPending={analysisQuery.isPending}
          />
        </FadeUp>
        <FadeUp delay={0.46}>
          <MostWishlistedCard
            products={analysisQuery.data?.products.mostWishlisted ?? []}
            isPending={analysisQuery.isPending}
          />
        </FadeUp>
      </div>

      <div className="mt-8">
        <FadeUp delay={0.5}>
          <RecentOrdersCard />
        </FadeUp>
      </div>
    </PageTransition>
  );
}

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  isPending: boolean;
  value?: string;
  helper?: string;
  helperHref?: string;
  helperLabel?: string;
  helperSearch?: Record<string, unknown>;
}

function KpiCard({
  label,
  icon: Icon,
  isPending,
  value,
  helper,
  helperHref,
  helperLabel = 'Manage',
  helperSearch,
}: KpiCardProps) {
  return (
    <Card padding="none" className="group h-full overflow-hidden">
      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>{label}</Eyebrow>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
          >
            <Icon size={15} strokeWidth={1.75} />
          </span>
        </div>

        <div className="mt-3 flex-1">
          {isPending ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <MetricValue size="lg" delta={null}>
              {value ?? '—'}
            </MetricValue>
          )}
          {helper && !isPending ? (
            <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
          ) : null}
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

function InventoryValueCard({
  analysis,
  isPending,
}: {
  analysis: ApiProductAnalysis | undefined;
  isPending: boolean;
}) {
  const final = analysis?.products.totalFinalPrice ?? 0;
  const wholesale = analysis?.products.totalWholesalePrice ?? 0;
  const margin = final > 0 ? Math.round(((final - wholesale) / final) * 100) : 0;

  return (
    <Card padding="none" className="h-full overflow-hidden">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>Inventory value</Eyebrow>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
          >
            <Boxes size={15} strokeWidth={1.75} />
          </span>
        </div>
        <div className="mt-3 flex-1">
          {isPending ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <MetricValue size="lg" delta={null}>{formatEGP(final)}</MetricValue>
          )}
          {!isPending ? (
            <p className="mt-2 text-xs text-muted-foreground font-tabular">
              Wholesale {formatEGP(wholesale)} · ~{margin}% margin
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function Last7DaysCard({
  analysis,
  isPending,
}: {
  analysis: ApiProductAnalysis | undefined;
  isPending: boolean;
}) {
  const [mode, setMode] = useState<'revenue' | 'orders'>('revenue');
  const data = analysis?.orders.last7Days ?? [];
  const empty = !isPending && data.length === 0;

  return (
    <Card padding="none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">Last 7 days</h2>
          <Eyebrow as="p" className="mt-0.5">
            {mode === 'revenue' ? 'Daily revenue' : 'Daily order volume'}
          </Eyebrow>
        </div>
        <div
          role="tablist"
          aria-label="Chart mode"
          className="inline-flex h-9 items-center rounded-full border border-border bg-card p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'revenue'}
            onClick={() => setMode('revenue')}
            className={
              mode === 'revenue'
                ? 'inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-medium text-accent-foreground'
                : 'inline-flex h-7 items-center rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground'
            }
          >
            Revenue
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'orders'}
            onClick={() => setMode('orders')}
            className={
              mode === 'orders'
                ? 'inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-medium text-accent-foreground'
                : 'inline-flex h-7 items-center rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground'
            }
          >
            Orders
          </button>
        </div>
      </div>
      <div className="px-2 py-4 sm:px-4">
        {isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : empty ? (
          <EmptyState
            title="No data in the last week"
            description="Once orders come in they'll plot here."
          />
        ) : (
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <Last7DaysChart data={data} mode={mode} />
          </Suspense>
        )}
      </div>
    </Card>
  );
}

function OrdersByStatusCard({
  analysis,
  isPending,
}: {
  analysis: ApiProductAnalysis | undefined;
  isPending: boolean;
}) {
  const chartData = useMemo(() => {
    if (!analysis) return [];
    return ORDER_STATUSES.map((status: OrderStatus) => ({
      status,
      label: ORDER_STATUS_META[status].label,
      count: analysis.orders.byStatus[status] ?? 0,
    }));
  }, [analysis]);

  const allZero = chartData.every((c) => c.count === 0);

  return (
    <Card>
      <div className="mb-2">
        <h2 className="m-0 text-base font-semibold text-foreground">By status</h2>
        <Eyebrow as="p" className="mt-0.5">Order distribution</Eyebrow>
      </div>
      {isPending ? (
        <Skeleton className="mt-4 h-48 w-full" />
      ) : allZero ? (
        <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
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

function TopSellingCard({
  products,
  isPending,
}: {
  products: AnalysisTopSellingProduct[];
  isPending: boolean;
}) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-foreground">
            <Crown size={14} strokeWidth={1.75} aria-hidden className="text-accent" />
            Top selling
          </h2>
          <Eyebrow as="p" className="mt-0.5">Most units sold</Eyebrow>
        </div>
      </div>
      {isPending ? (
        <ul className="space-y-2 px-4 py-4 sm:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-12 w-full" />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState
            title="Nothing sold yet"
            description="As orders complete, top-selling products appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {products.slice(0, 5).map((p, idx) => (
            <li key={p._id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <span
                aria-hidden
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent"
              >
                {idx + 1}
              </span>
              <Thumbnail src={p.defaultImage?.mediaUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  to={ROUTES.productDetail(p._id) as never}
                  className="block truncate text-sm font-medium text-foreground hover:text-accent"
                >
                  {toEN(p.name) || '—'}
                </Link>
                {p.finalPrice != null ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatEGP(p.finalPrice)}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground">
                {formatNumber(p.soldItems)} sold
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MostWishlistedCard({
  products,
  isPending,
}: {
  products: AnalysisWishlistedProduct[];
  isPending: boolean;
}) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-foreground">
            <Heart size={14} strokeWidth={1.75} aria-hidden className="text-accent" />
            Most wishlisted
          </h2>
          <Eyebrow as="p" className="mt-0.5">Saved-for-later leaders</Eyebrow>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.wishlist} search={{ page: 1 }}>
            View wishlist
            <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
          </Link>
        </Button>
      </div>
      {isPending ? (
        <ul className="space-y-2 px-4 py-4 sm:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-12 w-full" />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState
            title="Empty wishlists"
            description="When customers save products, they'll surface here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {products.slice(0, 5).map((entry) => (
            <li key={entry.product._id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <Thumbnail src={entry.product.defaultImage?.mediaUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  to={ROUTES.productDetail(entry.product._id) as never}
                  className="block truncate text-sm font-medium text-foreground hover:text-accent"
                >
                  {toEN(entry.product.name) || '—'}
                </Link>
                {entry.product.finalPrice != null ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatEGP(entry.product.finalPrice)}
                  </p>
                ) : null}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                <Heart size={10} strokeWidth={1.75} aria-hidden />
                {formatNumber(entry.count)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
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
        meta: { numeric: true },
        cell: ({ row }) => (
          <NumericCell className="font-medium">{formatEGP(row.original.total)}</NumericCell>
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
          <h2 className="m-0 text-base font-semibold text-foreground">Recent orders</h2>
          <Eyebrow as="p" className="mt-0.5">Latest activity</Eyebrow>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.orders} search={{ page: 1, search: '' }}>
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

