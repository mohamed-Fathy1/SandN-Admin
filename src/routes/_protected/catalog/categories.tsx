import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const CategoriesPage = lazy(() =>
  import('@/designs/catalog/categories-page').then((m) => ({ default: m.CategoriesPage }))
);

export const Route = createFileRoute('/_protected/catalog/categories')({
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <CategoriesPage />
    </Suspense>
  ),
});
