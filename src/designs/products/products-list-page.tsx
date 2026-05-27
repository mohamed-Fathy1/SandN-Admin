import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AdminTable,
  Button,
  ConfirmDialog,
  PageTransition,
  TableToolbar,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import {
  useProductSearch,
  useProducts,
  useSoftDeleteProduct,
} from '@/features/products/hooks/use-products';
import { prefetchProduct } from '@/features/products/hooks/use-products';
import type { ApiProduct } from '@/shared/types/api';
import { formatDate, formatEGP } from '@/shared/utils/format';
import { nameOf } from '@/shared/utils/relations';

interface ProductsListPageProps {
  page: number;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
}

export function ProductsListPage({
  page,
  search,
  onPageChange,
  onSearchChange,
}: ProductsListPageProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const deferredSearch = useDeferredValue(search);
  const isSearching = deferredSearch.trim().length >= 2;

  const listQuery = useProducts(page);
  const searchQuery = useProductSearch(deferredSearch, isSearching);

  const activeQuery = isSearching ? searchQuery : listQuery;

  // The list endpoint excludes soft-deleted rows server-side — no Deleted tab in v1.
  // Tracked in CLAUDE.md known-gaps; revisit once the API surfaces deleted products.
  const products: ApiProduct[] = isSearching
    ? (searchQuery.data ?? [])
    : (listQuery.data?.products ?? []);

  const softDelete = useSoftDeleteProduct();
  const [softDeleting, setSoftDeleting] = useState<ApiProduct | null>(null);

  const columns = useMemo<ColumnDef<ApiProduct>[]>(
    () => [
      {
        id: 'image',
        header: '',
        enableSorting: false,
        size: 56,
        cell: ({ row }) => <Thumbnail src={row.original.defaultImage?.mediaUrl} size="md" />,
      },
      {
        id: 'name',
        header: 'Name',
        accessorFn: (p) => p.name.en,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name.en}</span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (p) => nameOf(p.category),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{nameOf(row.original.category)}</span>
        ),
      },
      {
        id: 'subCategory',
        header: 'Sub-Category',
        accessorFn: (p) => nameOf(p.subCategory),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{nameOf(row.original.subCategory)}</span>
        ),
      },
      {
        id: 'price',
        header: 'Price',
        accessorFn: (p) => p.price,
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">{formatEGP(row.original.price)}</span>
        ),
      },
      {
        id: 'salePrice',
        header: 'Sale',
        accessorFn: (p) => p.salePrice,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.salePrice > 0 ? formatEGP(row.original.salePrice) : '—'}
          </span>
        ),
      },
      {
        id: 'variants',
        header: 'Variants',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.variants?.length ?? 0}
          </span>
        ),
      },
      {
        id: 'created',
        header: 'Created',
        accessorFn: (p) => p.createdAt ?? '',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: ROUTES.productDetail(row.original._id) });
              }}
            >
              <Pencil size={14} strokeWidth={1.5} aria-hidden />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSoftDeleting(row.original);
              }}
              aria-label="Remove from storefront"
            >
              <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const prefetchDetail = (row: ApiProduct) => {
    prefetchProduct(qc, row._id);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Products"
        subtitle="The full catalog. Edit details, manage variants, or take a product offline."
        action={
          <Button onClick={() => navigate({ to: ROUTES.productsNew })}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add Product
          </Button>
        }
      />

      <div className="mb-4">
        <TableToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search products…"
          meta={
            isSearching
              ? searchQuery.isFetching
                ? 'Searching…'
                : `${products.length} result${products.length === 1 ? '' : 's'}`
              : (listQuery.data?.totalItems ?? products.length)
                ? `${listQuery.data?.totalItems ?? products.length} products`
                : undefined
          }
        />
      </div>

      <AdminTable
        data={products}
        columns={columns}
        isLoading={activeQuery.isPending}
        isError={activeQuery.isError}
        error={activeQuery.error}
        onRetry={() => activeQuery.refetch()}
        getRowId={(p) => p._id}
        onRowHover={prefetchDetail}
        stickyFirstCol
        isFiltered={isSearching}
        onClearFilters={() => onSearchChange('')}
        mobileRender={(product) => (
          <Link
            to={ROUTES.productDetail(product._id)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Thumbnail src={product.defaultImage?.mediaUrl} size="lg" rounded="xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {product.name.en}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {nameOf(product.category)}
              </p>
              <p className="mt-1 flex items-baseline gap-2 text-xs">
                <span className="tabular-nums font-medium text-foreground">
                  {formatEGP(product.price)}
                </span>
                {product.salePrice > 0 ? (
                  <span className="tabular-nums text-light-foreground line-through">
                    {formatEGP(product.salePrice)}
                  </span>
                ) : null}
              </p>
            </div>
            <Pencil size={14} strokeWidth={1.5} aria-hidden className="text-light-foreground" />
          </Link>
        )}
        pagination={
          isSearching
            ? undefined
            : {
                page,
                totalPages: listQuery.data?.totalPages ?? 1,
                onPageChange,
              }
        }
        emptyState={{
          title: isSearching ? undefined : 'No products yet',
          description: isSearching
            ? undefined
            : 'Create your first product to populate the storefront.',
          action: !isSearching ? (
            <Button asChild>
              <Link to={ROUTES.productsNew}>
                <Plus size={16} strokeWidth={1.5} aria-hidden />
                Add Product
              </Link>
            </Button>
          ) : undefined,
        }}
      />

      <ConfirmDialog
        open={softDeleting !== null}
        onOpenChange={(o) => !o && setSoftDeleting(null)}
        title={`Remove "${softDeleting?.name.en}"?`}
        description="The product will be hidden from the storefront."
        variant="warning"
        confirmLabel="Remove"
        isPending={softDelete.isPending}
        onConfirm={() => {
          if (!softDeleting) return;
          softDelete.mutate(softDeleting._id, { onSuccess: () => setSoftDeleting(null) });
        }}
      />
    </PageTransition>
  );
}
