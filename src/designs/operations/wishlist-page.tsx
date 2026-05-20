import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';
import { AdminTable, Button } from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import { useWishlist } from '@/features/wishlist/hooks/use-wishlist';
import { fetchProduct } from '@/features/products/api/products';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import type { ApiWishlistItem } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils/format';
import { toEN } from '@/shared/utils/bilingual';

interface WishlistPageProps {
  page: number;
  onPageChange: (page: number) => void;
}

export function WishlistPage({ page, onPageChange }: WishlistPageProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const wishlistQuery = useWishlist(page);
  const items = wishlistQuery.data?.wishlistItems ?? [];

  const prefetchProduct = (row: ApiWishlistItem) => {
    const id = row.product?._id;
    if (!id) return;
    qc.prefetchQuery({
      queryKey: adminQueryKeys.products.detail(id),
      queryFn: () => fetchProduct(id),
    });
  };

  const columns = useMemo<ColumnDef<ApiWishlistItem>[]>(
    () => [
      {
        id: 'image',
        header: '',
        enableSorting: false,
        size: 60,
        cell: ({ row }) =>
          row.original.product?.defaultImage ? (
            <img
              src={row.original.product.defaultImage}
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
        header: 'Product',
        accessorFn: (i) => toEN(i.product?.name),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {toEN(row.original.product?.name) || '—'}
          </span>
        ),
      },
      {
        id: 'customer',
        header: 'Customer ID',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.customer ?? '—'}
          </span>
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

  return (
    <>
      <PageHeader
        title="Wishlist"
        subtitle="What customers are saving for later. Read-only."
      />

      <AdminTable
        data={items}
        columns={columns}
        isLoading={wishlistQuery.isPending}
        isError={wishlistQuery.isError}
        error={wishlistQuery.error}
        onRetry={() => wishlistQuery.refetch()}
        getRowId={(i) => i._id}
        onRowHover={prefetchProduct}
        pagination={{
          page,
          totalPages: wishlistQuery.data?.totalPages ?? 1,
          onPageChange,
        }}
        emptyState={{
          title: 'No saved items',
          description: 'No customers have added products to their wishlist yet.',
        }}
      />
    </>
  );
}
