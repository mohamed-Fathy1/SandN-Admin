import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Search, X } from 'lucide-react';
import {
  AdminTable,
  Button,
  Input,
  StatusBadge,
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
    <>
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

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-foreground"
          />
          <Input
            type="search"
            value={orderNumberFilter}
            onChange={(e) => setOrderNumberFilter(e.target.value)}
            placeholder="Filter by order number…"
            className="pl-9 pr-9"
            aria-label="Filter by order number"
          />
          {orderNumberFilter ? (
            <button
              type="button"
              onClick={() => setOrderNumberFilter('')}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-light-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={14} strokeWidth={1.5} aria-hidden />
            </button>
          ) : null}
        </div>
        {orderNumberFilter ? (
          <span className="text-xs text-muted-foreground">
            {orders.length} of {allOrders.length} on this page
          </span>
        ) : null}
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
        pagination={{
          page,
          totalPages: listQuery.data?.totalPages ?? 1,
          onPageChange,
        }}
        emptyState={{
          title: 'No orders',
          description: status
            ? `No orders with status "${status}".`
            : 'No orders have been placed yet.',
        }}
      />
    </>
  );
}
