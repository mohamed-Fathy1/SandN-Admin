import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { z } from 'zod';
import { PageSkeleton } from '@/designs/shared';

const ProductsListPage = lazy(() =>
  import('@/designs/products/products-list-page').then((m) => ({ default: m.ProductsListPage }))
);

const productsSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  search: z.string().catch(''),
});

export const Route = createFileRoute('/_protected/products/')({
  validateSearch: productsSearchSchema,
  component: ProductsRouteComponent,
});

function ProductsRouteComponent() {
  const { page, search } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductsListPage
        page={page}
        search={search}
        onPageChange={(next) => navigate({ search: (s) => ({ ...s, page: next }) })}
        onSearchChange={(next) =>
          navigate({ search: (s) => ({ ...s, search: next, page: 1 }) })
        }
      />
    </Suspense>
  );
}
