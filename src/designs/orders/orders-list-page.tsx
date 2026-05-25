import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
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
import { fetchOrder } from '@/features/orders/api/orders';
import { ORDER_STATUS_TABS } from '@/features/orders/lib/status-meta';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import type { ApiOrder } from '@/shared/types/api';
import { formatDateTime, formatEGP } from '@/shared/utils/format';
import { nameOf } from '@/shared/utils/relations';

interface OrdersListPageProps {
  page: number;
  status?: OrderStatus;
  onPageChange: (page: number) => void;
  onStatusChange: (status: OrderStatus | undefined) => void;
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

  const columns = useMemo<ColumnDef<ApiOrder>[]>(
    () => [
      {
        id: 'orderNumber',
        header: 'Order #',
        accessorFn: (o) => o.orderNumber,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground">{row.original.orderNumber}</span>
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
            <div className="leading-tight">
              <div className="font-medium text-foreground">{name || '—'}</div>
              <div className="text-xs text-muted-foreground">
                {row.original.customerPhone ?? '—'}
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
            {row.original.products?.length ?? 0}
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
        id: 'createdAt',
        header: 'Placed',
        accessorFn: (o) => o.createdAt,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
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
            >
              <Eye size={14} strokeWidth={1.5} aria-hidden />
              View
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const prefetchDetail = (row: ApiOrder) => {
    qc.prefetchQuery({
      queryKey: adminQueryKeys.orders.detail(row._id),
      queryFn: () => fetchOrder(row._id),
    });
  };

  const tabValue = status ?? 'all';

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
              {ORDER_STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
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
          return (
            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.orderDetail(order._id) })}
              className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-card transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-foreground">
                    {order.orderNumber}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="mt-1 truncate text-sm font-medium text-foreground">{name}</p>
                <p className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{order.products?.length ?? 0} items</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {formatEGP(order.total)}
                  </span>
                </p>
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
              ? `No orders with status "${status}".`
              : 'No orders have been placed yet.',
        }}
      />
    </PageTransition>
  );
}
