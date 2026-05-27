import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  AdminTable,
  Button,
  PageTransition,
  StatusBadge,
  TableToolbar,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES, type OrderStatus } from '@/config/constants';
import { useOrders } from '@/features/orders/hooks/use-orders';
import { prefetchOrder } from '@/features/orders/hooks/use-orders';
import { ORDER_STATUS_TABS } from '@/features/orders/lib/status-meta';
import type { ApiOrder } from '@/shared/types/api';
import { formatEGP } from '@/shared/utils/format';
import { nameOf } from '@/shared/utils/relations';
import { cn } from '@/shared/utils/cn';

interface OrdersListPageProps {
  page: number;
  status?: OrderStatus;
  onPageChange: (page: number) => void;
  onStatusChange: (status: OrderStatus | undefined) => void;
}

const PENDING_STATUSES: OrderStatus[] = ['ordered', 'confirmed', 'under_review'];

function getInitials(first?: string, last?: string): string {
  const a = first?.trim()?.[0] ?? '';
  const b = last?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '—';
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function OrdersListPage({
  page,
  status,
  onPageChange,
  onStatusChange,
}: OrdersListPageProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listQuery = useOrders({ page, status });
  const allOrders = useMemo(() => listQuery.data?.orders ?? [], [listQuery.data]);
  const [orderNumberFilter, setOrderNumberFilter] = useState('');

  const orders = useMemo(() => {
    const term = orderNumberFilter.trim().toLowerCase();
    if (!term) return allOrders;
    return allOrders.filter((o) => o.orderNumber.toLowerCase().includes(term));
  }, [allOrders, orderNumberFilter]);

  const kpis = useMemo(() => {
    const pageCount = allOrders.length;
    const pending = allOrders.filter((o) => PENDING_STATUSES.includes(o.status)).length;
    const shippedToday = allOrders.filter(
      (o) => o.status === 'shipped' && isToday(o.createdAt)
    ).length;
    const revenue = allOrders.reduce((sum, o) => {
      if (o.status === 'cancelled' || o.status === 'deleted') return sum;
      return sum + (o.total ?? 0);
    }, 0);
    return { pageCount, pending, shippedToday, revenue };
  }, [allOrders]);

  const tabCounts = useMemo(() => {
    if (status !== undefined) return null;
    const counts: Record<string, number> = { all: allOrders.length };
    for (const o of allOrders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  }, [allOrders, status]);

  const columns = useMemo<ColumnDef<ApiOrder>[]>(
    () => [
      {
        id: 'orderNumber',
        header: 'Order #',
        accessorFn: (o) => o.orderNumber,
        cell: ({ row }) => (
          <div className="leading-tight">
            <span className="font-mono text-xs text-foreground">{row.original.orderNumber}</span>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {timeAgo(row.original.createdAt)}
            </div>
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        enableSorting: false,
        cell: ({ row }) => {
          const info = row.original.customerInfo;
          const name = `${info?.firstName ?? ''} ${info?.lastName ?? ''}`.trim();
          return (
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold tracking-wide text-accent"
              >
                {getInitials(info?.firstName, info?.lastName)}
              </span>
              <div className="min-w-0 leading-tight">
                <div className="truncate font-medium text-foreground">{name || '—'}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.original.customerPhone ?? '—'}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'items',
        header: 'Items',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            <span className="text-light-foreground">×</span> {row.original.products?.length ?? 0}
          </span>
        ),
      },
      {
        id: 'shipping',
        header: 'Region',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {nameOf(row.original.customerInfo?.shipping)}
          </span>
        ),
      },
      {
        id: 'total',
        header: 'Total',
        accessorFn: (o) => o.total,
        cell: ({ row }) => (
          <span className="text-sm font-semibold tabular-nums text-foreground">
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
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: ROUTES.orderDetail(row.original._id) });
              }}
              aria-label={`View order ${row.original.orderNumber}`}
            >
              <Eye size={14} strokeWidth={1.5} aria-hidden />
              <span className="hidden xl:inline">View</span>
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const prefetchDetail = (row: ApiOrder) => {
    prefetchOrder(qc, row._id);
  };

  const tabValue = status ?? 'all';
  const activeTabLabel =
    ORDER_STATUS_TABS.find((t) => t.value === tabValue)?.label ?? 'All';

  return (
    <PageTransition>
      <PageHeader
        title="Orders"
        subtitle="Filter by status, drill in to confirm, ship, or cancel an order."
        tabs={
          <Tabs
            value={tabValue}
            onValueChange={(v) => onStatusChange(v === 'all' ? undefined : (v as OrderStatus))}
          >
            <TabsList className="flex-wrap">
              {ORDER_STATUS_TABS.map((tab) => {
                const count = tabCounts?.[tab.value];
                const showCount = tabCounts && count !== undefined;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="group">
                    <span>{tab.label}</span>
                    {showCount ? (
                      <span
                        className={cn(
                          'ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums',
                          'bg-muted text-muted-foreground',
                          'group-data-[state=active]:bg-white/25 group-data-[state=active]:text-accent-foreground'
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        }
      />

      <KpiStrip
        pageCount={kpis.pageCount}
        pending={kpis.pending}
        shippedToday={kpis.shippedToday}
        revenue={kpis.revenue}
        loading={listQuery.isPending}
      />

      <div className="mb-4">
        <TableToolbar
          search={orderNumberFilter}
          onSearchChange={setOrderNumberFilter}
          searchPlaceholder="Filter by order number…"
          meta={
            orderNumberFilter
              ? `${orders.length} of ${allOrders.length} on this page`
              : allOrders.length
                ? `${allOrders.length} on this page`
                : undefined
          }
        />
      </div>

      <AdminTable
        data={orders}
        columns={columns}
        isLoading={listQuery.isPending}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={() => listQuery.refetch()}
        getRowId={(o) => o._id}
        onRowHover={prefetchDetail}
        onRowClick={(o) => navigate({ to: ROUTES.orderDetail(o._id) })}
        stickyFirstCol
        isFiltered={Boolean(orderNumberFilter)}
        onClearFilters={() => setOrderNumberFilter('')}
        mobileRender={(order) => {
          const info = order.customerInfo;
          const name = `${info?.firstName ?? ''} ${info?.lastName ?? ''}`.trim() || '—';
          const placed = timeAgo(order.createdAt);
          return (
            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.orderDetail(order._id) })}
              className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold tracking-wide text-accent"
              >
                {getInitials(info?.firstName, info?.lastName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-baseline gap-2 truncate">
                    <span className="font-mono text-xs text-foreground">{order.orderNumber}</span>
                    {placed ? (
                      <span className="truncate text-[11px] text-light-foreground">· {placed}</span>
                    ) : null}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="mt-1 truncate text-sm font-medium text-foreground">{name}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {order.products?.length ?? 0} items
                  </span>
                  <span className="text-base font-semibold leading-none tabular-nums text-foreground">
                    {formatEGP(order.total)}
                  </span>
                </div>
              </div>
            </button>
          );
        }}
        pagination={{
          page,
          totalPages: listQuery.data?.totalPages ?? 1,
          onPageChange,
        }}
        emptyState={{
          title: orderNumberFilter ? undefined : 'No orders',
          description: orderNumberFilter
            ? undefined
            : status
              ? `No ${activeTabLabel.toLowerCase()} orders yet.`
              : 'No orders have been placed yet.',
        }}
      />
    </PageTransition>
  );
}

function KpiStrip({
  pageCount,
  pending,
  shippedToday,
  revenue,
  loading,
}: {
  pageCount: number;
  pending: number;
  shippedToday: number;
  revenue: number;
  loading: boolean;
}) {
  const cells: { label: string; value: string; tone?: 'accent' }[] = [
    { label: 'On this page', value: loading ? '—' : String(pageCount) },
    { label: 'Pending action', value: loading ? '—' : String(pending), tone: 'accent' },
    { label: 'Shipped today', value: loading ? '—' : String(shippedToday) },
    { label: 'Revenue (page)', value: loading ? '—' : formatEGP(revenue) },
  ];
  return (
    <div className="mb-5 hidden border-y border-border md:block">
      <dl className="grid grid-cols-4 divide-x divide-border">
        {cells.map((c) => (
          <div key={c.label} className="px-5 py-4">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {c.label}
            </dt>
            <dd
              className={cn(
                'mt-1 text-xl font-semibold leading-none tabular-nums lg:text-2xl',
                c.tone === 'accent' && pending > 0 ? 'text-accent' : 'text-foreground'
              )}
            >
              {c.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
