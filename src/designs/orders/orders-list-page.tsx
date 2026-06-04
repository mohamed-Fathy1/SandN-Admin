import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ar as dfAr, enUS as dfEn } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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
import { ROUTES, type Locale, type OrderStatus } from '@/config/constants';
import { useLocaleStore } from '@/shared/stores/locale-store';
import { useOrders } from '@/features/orders/hooks/use-orders';
import { prefetchOrder } from '@/features/orders/hooks/use-orders';
import { ORDER_STATUS_TABS } from '@/features/orders/lib/status-meta';
import { PaymentStatusBadge } from './payment-status-badge';
import type { ApiOrder } from '@/shared/types/api';
import { formatEGP } from '@/shared/utils/format';
import { nameOf } from '@/shared/utils/relations';
import { cn } from '@/shared/utils/cn';

interface OrdersListPageProps {
  page: number;
  status?: OrderStatus;
  search: string;
  onPageChange: (page: number) => void;
  onStatusChange: (status: OrderStatus | undefined) => void;
  onSearchChange: (next: string) => void;
}

const PENDING_STATUSES: OrderStatus[] = ['ordered', 'confirmed', 'under_review'];

function getInitials(first?: string, last?: string): string {
  const a = first?.trim()?.[0] ?? '';
  const b = last?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '—';
}

function timeAgo(iso?: string, locale?: Locale): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDistanceToNowStrict(d, {
    addSuffix: true,
    locale: locale === 'ar' ? dfAr : dfEn,
  });
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
  search,
  onPageChange,
  onStatusChange,
  onSearchChange,
}: OrdersListPageProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation('orders');
  const locale = useLocaleStore((s) => s.locale);

  const listQuery = useOrders({ page, status, search });
  const orders = useMemo(() => listQuery.data?.orders ?? [], [listQuery.data]);

  // Local input state so typing feels instant, then debounce-commit to URL.
  // React 19 derived-state pattern: update local state during render when the
  // tracked prop changes — avoids the cascading-render lint warning.
  const [searchInput, setSearchInput] = useState(search);
  const [lastSyncedSearch, setLastSyncedSearch] = useState(search);
  if (lastSyncedSearch !== search) {
    setLastSyncedSearch(search);
    setSearchInput(search);
  }

  const kpis = useMemo(() => {
    const pageCount = orders.length;
    const pending = orders.filter((o) => PENDING_STATUSES.includes(o.status)).length;
    const shippedToday = orders.filter(
      (o) => o.status === 'shipped' && isToday(o.createdAt)
    ).length;
    const revenue = orders.reduce((sum, o) => {
      if (o.status === 'cancelled' || o.status === 'deleted') return sum;
      return sum + (o.total ?? 0);
    }, 0);
    return { pageCount, pending, shippedToday, revenue };
  }, [orders]);

  const tabCounts = useMemo(() => {
    if (status !== undefined) return null;
    const counts: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  }, [orders, status]);

  const columns = useMemo<ColumnDef<ApiOrder>[]>(
    () => [
      {
        id: 'orderNumber',
        header: t('list.columns.orderNumber'),
        accessorFn: (o) => o.orderNumber,
        cell: ({ row }) => (
          <div className="leading-tight">
            <span className="font-mono text-xs text-foreground">{row.original.orderNumber}</span>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {timeAgo(row.original.createdAt, locale)}
            </div>
          </div>
        ),
      },
      {
        id: 'customer',
        header: t('list.columns.customer'),
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
        header: t('list.columns.items'),
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ row }) => {
          const n = row.original.products?.length ?? 0;
          return (
            <span className="font-tabular text-muted-foreground">
              {t('list.items', { count: n })}
            </span>
          );
        },
      },
      {
        id: 'shipping',
        header: t('list.columns.region'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {nameOf(row.original.customerInfo?.shipping)}
          </span>
        ),
      },
      {
        id: 'total',
        header: t('list.columns.total'),
        accessorFn: (o) => o.total,
        meta: { numeric: true },
        cell: ({ row }) => (
          <span className="text-sm font-semibold font-tabular text-foreground">
            {formatEGP(row.original.total)}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('list.columns.status'),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={row.original.status} size="sm" />
            {row.original.payment.status !== 'unpaid' ? (
              <PaymentStatusBadge status={row.original.payment.status} size="sm" />
            ) : null}
          </div>
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
              aria-label={t('list.viewOrder', { number: row.original.orderNumber })}
            >
              <Eye size={14} strokeWidth={1.5} aria-hidden />
              <span className="hidden xl:inline">{t('list.view')}</span>
            </Button>
          </div>
        ),
      },
    ],
    [navigate, t, locale]
  );

  const prefetchDetail = (row: ApiOrder) => {
    prefetchOrder(qc, row._id);
  };

  const tabValue = status ?? 'all';
  const activeTabLabel =
    status ? t(`status.${status}`) : t('tabs.all');

  return (
    <PageTransition>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
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
                    <span>{t(tab.labelKey)}</span>
                    {showCount ? (
                      <span
                        className={cn(
                          'ms-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none tabular-nums',
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
          search={searchInput}
          onSearchChange={setSearchInput}
          searchDebounceMs={300}
          onSearchCommit={(next) => {
            if (next !== search) onSearchChange(next);
          }}
          searchPlaceholder={t('list.searchPlaceholder')}
          meta={
            search
              ? t('list.matches', { count: orders.length })
              : orders.length
                ? t('list.onPage', { count: orders.length })
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
        isFiltered={Boolean(search)}
        onClearFilters={() => {
          setSearchInput('');
          onSearchChange('');
        }}
        mobileRender={(order) => {
          const info = order.customerInfo;
          const name = `${info?.firstName ?? ''} ${info?.lastName ?? ''}`.trim() || '—';
          const placed = timeAgo(order.createdAt, locale);
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
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={order.status} size="sm" />
                    {order.payment.status !== 'unpaid' ? (
                      <PaymentStatusBadge status={order.payment.status} size="sm" />
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-foreground">{name}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t('list.items', { count: order.products?.length ?? 0 })}
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
          title: search ? undefined : t('list.empty.title'),
          description: search
            ? undefined
            : status
              ? t('list.empty.noneStatus', { status: activeTabLabel })
              : t('list.empty.noneYet'),
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
  const { t } = useTranslation('orders');
  const cells: { label: string; value: string; tone?: 'accent' }[] = [
    { label: t('kpis.onPage'), value: loading ? '—' : String(pageCount) },
    { label: t('kpis.pendingAction'), value: loading ? '—' : String(pending), tone: 'accent' },
    { label: t('kpis.shippedToday'), value: loading ? '—' : String(shippedToday) },
    { label: t('kpis.revenuePage'), value: loading ? '—' : formatEGP(revenue) },
  ];
  return (
    <>
      {/* Desktop strip */}
      <div className="mb-5 hidden border-y border-border md:block">
        <dl className="grid grid-cols-4 divide-x divide-border">
          {cells.map((c) => (
            <div key={c.label} className="px-5 py-4">
              <dt className="text-eyebrow text-muted-foreground">{c.label}</dt>
              <dd
                className={cn(
                  'mt-1 text-xl font-semibold leading-none font-tabular lg:text-2xl',
                  c.tone === 'accent' && pending > 0 ? 'text-accent' : 'text-foreground'
                )}
              >
                {c.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {/* Mobile: horizontally scrollable compact chip row */}
      <div
        className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {cells.map((c) => (
          <div
            key={c.label}
            role="listitem"
            className="min-w-[140px] flex-shrink-0 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <dt className="text-eyebrow text-muted-foreground">{c.label}</dt>
            <dd
              className={cn(
                'mt-1 text-lg font-semibold leading-none font-tabular',
                c.tone === 'accent' && pending > 0 ? 'text-accent' : 'text-foreground'
              )}
            >
              {c.value}
            </dd>
          </div>
        ))}
      </div>
    </>
  );
}
