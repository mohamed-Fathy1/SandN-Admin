import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  AdminTable,
  Button,
  ConfirmDialog,
  FilterChip,
  GenericBadge,
  PageTransition,
  SearchableSelect,
  TableToolbar,
  Tabs,
  TabsList,
  TabsTrigger,
  Thumbnail,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import { ROUTES } from '@/config/constants';
import {
  prefetchProduct,
  useHardDeleteProduct,
  useProductSearch,
  useProducts,
  useRestoreProduct,
  useSoftDeleteProduct,
} from '@/features/products/hooks/use-products';
import { useCategories } from '@/features/catalog/categories/hooks/use-categories';
import { useSubCategories } from '@/features/catalog/sub-categories/hooks/use-sub-categories';
import type { ApiCategory, ApiProduct, ApiSubCategory } from '@/shared/types/api';
import { formatDate, formatEGP } from '@/shared/utils/format';
import { idOf, nameOf } from '@/shared/utils/relations';

export type ProductsListTab = 'active' | 'deleted';

export type ProductFlagFilter = 'isSale' | 'isNewArrival' | 'isBestSeller' | 'isSoldOut';

const FLAG_CHIPS: Array<{ key: ProductFlagFilter; label: string }> = [
  { key: 'isSale', label: 'On sale' },
  { key: 'isNewArrival', label: 'New' },
  { key: 'isBestSeller', label: 'Best' },
  { key: 'isSoldOut', label: 'Sold out' },
];

interface ProductsListPageProps {
  page: number;
  search: string;
  tab: ProductsListTab;
  category?: string;
  subCategory?: string;
  flags: ProductFlagFilter[];
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onTabChange: (tab: ProductsListTab) => void;
  onCategoryChange: (id: string | undefined) => void;
  onSubCategoryChange: (id: string | undefined) => void;
  onFlagsChange: (flags: ProductFlagFilter[]) => void;
}

export function ProductsListPage({
  page,
  search,
  tab,
  category,
  subCategory,
  flags,
  onPageChange,
  onSearchChange,
  onTabChange,
  onCategoryChange,
  onSubCategoryChange,
  onFlagsChange,
}: ProductsListPageProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const deferredSearch = useDeferredValue(search);
  const isSearching = deferredSearch.trim().length >= 2;

  const categoriesQuery = useCategories();
  const subCategoriesQuery = useSubCategories();

  const subCategoryOptions = useMemo(() => {
    const all = subCategoriesQuery.data ?? [];
    if (!category) return all;
    return all.filter((sc) => idOf(sc.category) === category);
  }, [subCategoriesQuery.data, category]);

  const filters = useMemo(
    () => ({
      page,
      category: category || undefined,
      subCategory: subCategory || undefined,
      isSale: flags.includes('isSale') ? true : undefined,
      isNewArrival: flags.includes('isNewArrival') ? true : undefined,
      isBestSeller: flags.includes('isBestSeller') ? true : undefined,
      isSoldOut: flags.includes('isSoldOut') ? true : undefined,
      isDeleted: tab === 'deleted' ? true : undefined,
    }),
    [page, category, subCategory, flags, tab]
  );

  const listQuery = useProducts(filters);
  const searchQuery = useProductSearch(deferredSearch, isSearching);

  const activeQuery = isSearching ? searchQuery : listQuery;

  const products: ApiProduct[] = isSearching
    ? (searchQuery.data ?? [])
    : (listQuery.data?.products ?? []);

  const softDelete = useSoftDeleteProduct();
  const restore = useRestoreProduct();
  const hardDelete = useHardDeleteProduct();
  const [softDeleting, setSoftDeleting] = useState<ApiProduct | null>(null);
  const [hardDeleting, setHardDeleting] = useState<ApiProduct | null>(null);

  const toggleFlag = (flag: ProductFlagFilter) => {
    onFlagsChange(flags.includes(flag) ? flags.filter((f) => f !== flag) : [...flags, flag]);
  };

  const hasActiveFilters =
    isSearching || flags.length > 0 || Boolean(category) || Boolean(subCategory);

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
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.original.name.en}</p>
            <ProductBadgeRow product={row.original} />
          </div>
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
        accessorFn: (p) => p.finalPrice ?? p.price,
        cell: ({ row }) => <PriceCell product={row.original} />,
      },
      {
        id: 'sold',
        header: 'Sold',
        accessorFn: (p) => p.soldItems ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.soldItems ?? 0}
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
        cell: ({ row }) =>
          tab === 'active' ? (
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
          ) : (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  restore.mutate(row.original._id);
                }}
                isLoading={restore.isPending && restore.variables === row.original._id}
              >
                <RotateCcw size={14} strokeWidth={1.5} aria-hidden />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setHardDeleting(row.original);
                }}
                aria-label="Permanently delete"
              >
                <Trash2 size={14} strokeWidth={1.5} aria-hidden className="text-destructive" />
              </Button>
            </div>
          ),
      },
    ],
    [navigate, tab, restore]
  );

  const prefetchDetail = (row: ApiProduct) => {
    prefetchProduct(qc, row._id);
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onCategoryChange(undefined);
    onSubCategoryChange(undefined);
    onFlagsChange([]);
  };

  const filterMetaCount = isSearching
    ? products.length
    : (listQuery.data?.totalItems ?? products.length);

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
        tabs={
          <Tabs value={tab} onValueChange={(v) => onTabChange(v as ProductsListTab)}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="deleted">Deleted</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="mb-4">
        <TableToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search products by name…"
          meta={
            isSearching
              ? searchQuery.isFetching
                ? 'Searching…'
                : `${products.length} result${products.length === 1 ? '' : 's'}`
              : filterMetaCount
                ? `${filterMetaCount} products`
                : undefined
          }
          filters={
            <>
              <SearchableSelect<ApiCategory>
                value={category}
                onChange={(v) => {
                  onCategoryChange(v ?? undefined);
                  if (v !== category) onSubCategoryChange(undefined);
                }}
                items={categoriesQuery.data ?? []}
                getKey={(c) => c._id}
                getLabel={(c) => c.name.en}
                placeholder="All categories"
                clearable
                className="min-w-[180px]"
              />
              <SearchableSelect<ApiSubCategory>
                value={subCategory}
                onChange={(v) => onSubCategoryChange(v ?? undefined)}
                items={subCategoryOptions}
                getKey={(c) => c._id}
                getLabel={(c) => c.name.en}
                placeholder={
                  category ? 'All sub-categories' : 'Pick a category first'
                }
                disabled={!category}
                clearable
                className="min-w-[180px]"
              />
              {FLAG_CHIPS.map((chip) => (
                <FilterChip
                  key={chip.key}
                  active={flags.includes(chip.key)}
                  onClick={() => toggleFlag(chip.key)}
                >
                  {chip.label}
                </FilterChip>
              ))}
            </>
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
        isFiltered={hasActiveFilters}
        onClearFilters={clearAllFilters}
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
                  {formatEGP(product.finalPrice ?? product.price)}
                </span>
                {product.isSale && product.salePrice > 0 ? (
                  <span className="tabular-nums text-light-foreground line-through">
                    {formatEGP(product.price)}
                  </span>
                ) : null}
              </p>
              <ProductBadgeRow product={product} className="mt-1" />
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
          title:
            tab === 'deleted'
              ? 'Nothing in the trash'
              : isSearching
                ? undefined
                : 'No products yet',
          description:
            tab === 'deleted'
              ? 'Soft-deleted products will appear here.'
              : isSearching
                ? undefined
                : 'Create your first product to populate the storefront.',
          action:
            tab === 'active' && !isSearching ? (
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
        description="The product will be hidden from the storefront. You can restore it from the Deleted tab."
        variant="warning"
        confirmLabel="Remove"
        isPending={softDelete.isPending}
        onConfirm={() => {
          if (!softDeleting) return;
          softDelete.mutate(softDeleting._id, { onSuccess: () => setSoftDeleting(null) });
        }}
      />

      <ConfirmDialog
        open={hardDeleting !== null}
        onOpenChange={(o) => !o && setHardDeleting(null)}
        title={`Permanently delete "${hardDeleting?.name.en}"?`}
        description="This removes the product, its variants, and S3 images. Cannot be undone."
        confirmLabel="Delete permanently"
        requireTypedConfirmation="delete"
        isPending={hardDelete.isPending}
        onConfirm={() => {
          if (!hardDeleting) return;
          hardDelete.mutate(hardDeleting._id, { onSuccess: () => setHardDeleting(null) });
        }}
      />
    </PageTransition>
  );
}

function PriceCell({ product }: { product: ApiProduct }) {
  const final = product.finalPrice ?? product.price;
  if (product.isSale && product.salePrice > 0 && product.salePrice < product.price) {
    return (
      <span className="flex items-baseline gap-2">
        <span className="tabular-nums font-medium text-foreground">{formatEGP(final)}</span>
        <span className="tabular-nums text-xs text-light-foreground line-through">
          {formatEGP(product.price)}
        </span>
      </span>
    );
  }
  return <span className="tabular-nums text-foreground">{formatEGP(final)}</span>;
}

function ProductBadgeRow({
  product,
  className,
}: {
  product: ApiProduct;
  className?: string;
}) {
  const badges: Array<{ key: string; label: string; tone: 'accent' | 'success' | 'warning' | 'destructive' }> = [];
  if (product.isSale) badges.push({ key: 'sale', label: 'Sale', tone: 'accent' });
  if (product.isNewArrival) badges.push({ key: 'new', label: 'New', tone: 'success' });
  if (product.isBestSeller) badges.push({ key: 'best', label: 'Best', tone: 'warning' });
  if (product.isSoldOut) badges.push({ key: 'sold', label: 'Sold out', tone: 'destructive' });
  if (badges.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? 'mt-1'}`}>
      {badges.map((b) => (
        <GenericBadge key={b.key} label={b.label} tone={b.tone} size="sm" />
      ))}
    </div>
  );
}
