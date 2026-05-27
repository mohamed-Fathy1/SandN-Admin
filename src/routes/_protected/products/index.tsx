import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { z } from 'zod';
import { PageSkeleton } from '@/designs/shared';

const ProductsListPage = lazy(() =>
  import('@/designs/products/products-list-page').then((m) => ({ default: m.ProductsListPage }))
);

const PRODUCT_FLAGS = ['isSale', 'isNewArrival', 'isBestSeller', 'isSoldOut'] as const;

const productsSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  search: z.string().catch(''),
  tab: z.enum(['active', 'deleted']).catch('active'),
  category: z.string().optional().catch(undefined),
  subCategory: z.string().optional().catch(undefined),
  flags: z.array(z.enum(PRODUCT_FLAGS)).catch([]),
});

export const Route = createFileRoute('/_protected/products/')({
  validateSearch: productsSearchSchema,
  component: ProductsRouteComponent,
});

function ProductsRouteComponent() {
  const { page, search, tab, category, subCategory, flags } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductsListPage
        page={page}
        search={search}
        tab={tab}
        category={category}
        subCategory={subCategory}
        flags={flags}
        onPageChange={(next) => navigate({ search: (s) => ({ ...s, page: next }) })}
        onSearchChange={(next) =>
          navigate({ search: (s) => ({ ...s, search: next, page: 1 }) })
        }
        onTabChange={(next) =>
          navigate({ search: (s) => ({ ...s, tab: next, page: 1 }) })
        }
        onCategoryChange={(next) =>
          navigate({
            search: (s) => ({ ...s, category: next, subCategory: undefined, page: 1 }),
          })
        }
        onSubCategoryChange={(next) =>
          navigate({ search: (s) => ({ ...s, subCategory: next, page: 1 }) })
        }
        onFlagsChange={(next) =>
          navigate({ search: (s) => ({ ...s, flags: next, page: 1 }) })
        }
      />
    </Suspense>
  );
}
