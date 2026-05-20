import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { AdminTable, Button, ConfirmDialog, Input } from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import {
  useProductSearch,
  useProducts,
  useSoftDeleteProduct,
} from '@/features/products/hooks/use-products';
import { fetchProduct } from '@/features/products/api/products';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
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
  const debouncedSearch = useDebouncedValue(search, 300);
  const isSearching = debouncedSearch.trim().length >= 2;

  const listQuery = useProducts(page);
  const searchQuery = useProductSearch(debouncedSearch, isSearching);

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
        size: 60,
        cell: ({ row }) =>
          row.original.defaultImage ? (
            <img
              src={row.original.defaultImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <span className="inline-block h-10 w-10 rounded-lg bg-muted" />
          ),
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
    qc.prefetchQuery({
      queryKey: adminQueryKeys.products.detail(row._id),
      queryFn: () => fetchProduct(row._id),
    });
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="The full catalog. Edit details, manage variants, or take a product offline."
        action={
          <Button onClick={() => navigate({ to: ROUTES.productsNew })}>
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Add product
          </Button>
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
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products…"
            className="pl-9 pr-9"
            aria-label="Search products"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-light-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={14} strokeWidth={1.5} aria-hidden />
            </button>
          ) : null}
        </div>
        {isSearching ? (
          <span className="text-xs text-muted-foreground">
            {searchQuery.isFetching ? 'Searching…' : `${products.length} result(s)`}
          </span>
        ) : null}
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
          title: isSearching ? 'No matches' : 'No products yet',
          description: isSearching
            ? 'Try a different search term.'
            : 'Create your first product to populate the storefront.',
          action: !isSearching ? (
            <Button asChild>
              <Link to={ROUTES.productsNew}>
                <Plus size={16} strokeWidth={1.5} aria-hidden />
                Add product
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
    </>
  );
}
