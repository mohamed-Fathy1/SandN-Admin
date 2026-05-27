import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ExternalLink, Mail, Phone } from 'lucide-react';
import { AdminTable, Button, TableToolbar, Thumbnail } from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import { useWishlist } from '@/features/wishlist/hooks/use-wishlist';
import { prefetchProduct } from '@/features/products/hooks/use-products';
import type { ApiWishlistEntry } from '@/shared/types/api';
import { formatDateTime, formatEGP } from '@/shared/utils/format';
import { toEN } from '@/shared/utils/bilingual';

interface WishlistPageProps {
  page: number;
  onPageChange: (page: number) => void;
}

export function WishlistPage({ page, onPageChange }: WishlistPageProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const wishlistQuery = useWishlist(page);
  const items = useMemo(() => wishlistQuery.data?.items ?? [], [wishlistQuery.data?.items]);
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return items;
    return items.filter((i) =>
      [
        toEN(i.product?.name) ?? '',
        i.customer?.phone ?? '',
        i.customer?.email ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [items, normalizedSearch]);
  const isFiltered = normalizedSearch.length > 0;

  const prefetchRow = (row: ApiWishlistEntry) => {
    const id = row.product?._id;
    if (!id) return;
    prefetchProduct(qc, id);
  };

  const columns = useMemo<ColumnDef<ApiWishlistEntry>[]>(
    () => [
      {
        id: 'image',
        header: '',
        enableSorting: false,
        size: 60,
        cell: ({ row }) => (
          <Thumbnail src={row.original.product?.defaultImage?.mediaUrl} size="sm" />
        ),
      },
      {
        id: 'name',
        header: 'Product',
        accessorFn: (i) => toEN(i.product?.name),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {toEN(row.original.product?.name) || '—'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {formatEGP(row.original.product?.finalPrice ?? row.original.product?.price ?? 0)}
            </p>
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0 space-y-0.5 text-xs">
            {row.original.customer?.phone ? (
              <p className="flex items-center gap-1.5 text-foreground">
                <Phone size={14} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted-foreground" />
                <span className="truncate font-tabular">{row.original.customer.phone}</span>
              </p>
            ) : null}
            {row.original.customer?.email ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Mail size={14} strokeWidth={1.75} aria-hidden className="shrink-0" />
                <span className="truncate">{row.original.customer.email}</span>
              </p>
            ) : null}
            {!row.original.customer?.phone && !row.original.customer?.email ? (
              <p className="font-mono text-xs text-light-foreground">
                {row.original.customer?._id ?? '—'}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'createdAt',
        header: 'Added',
        accessorFn: (i) => i.createdAt,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const productId = row.original.product?._id;
          if (!productId) return null;
          return (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({ to: ROUTES.productDetail(productId) });
                }}
              >
                <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
                Open
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate]
  );

  const totalItems = wishlistQuery.data?.totalItems ?? items.length;

  return (
    <>
      <PageHeader
        title="Wishlist"
        subtitle="What customers are saving for later. Read-only."
      />

      <div className="mb-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by product or customer…"
          meta={wishlistQuery.data ? `${filteredItems.length} of ${totalItems}` : undefined}
        />
      </div>

      <AdminTable
        data={filteredItems}
        columns={columns}
        isLoading={wishlistQuery.isPending}
        isError={wishlistQuery.isError}
        error={wishlistQuery.error}
        onRetry={() => wishlistQuery.refetch()}
        getRowId={(i) =>
          `${i.product?._id ?? 'no-product'}-${i.customer?._id ?? 'no-customer'}-${String(i.createdAt)}`
        }
        onRowHover={prefetchRow}
        isFiltered={isFiltered}
        onClearFilters={() => setSearch('')}
        pagination={{
          page,
          totalPages: wishlistQuery.data?.totalPages ?? 1,
          onPageChange,
        }}
        mobileRender={(i) => {
          const productId = i.product?._id;
          return (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <Thumbnail src={i.product?.defaultImage?.mediaUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {toEN(i.product?.name) || '—'}
                </p>
                {i.customer?.phone ? (
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {i.customer.phone}
                  </p>
                ) : null}
                {i.customer?.email ? (
                  <p className="truncate text-xs text-light-foreground">{i.customer.email}</p>
                ) : null}
                <p className="text-xs text-light-foreground">
                  {formatDateTime(i.createdAt)}
                </p>
              </div>
              {productId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: ROUTES.productDetail(productId) });
                  }}
                >
                  <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
                </Button>
              ) : null}
            </div>
          );
        }}
        emptyState={{
          title: 'No saved items',
          description: 'No customers have added products to their wishlist yet.',
        }}
      />
    </>
  );
}
