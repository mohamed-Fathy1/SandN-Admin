import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const SubCategoriesPage = lazy(() =>
  import('@/designs/catalog/sub-categories-page').then((m) => ({ default: m.SubCategoriesPage }))
);

export const Route = createFileRoute('/_protected/catalog/sub-categories')({
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <SubCategoriesPage />
    </Suspense>
  ),
});
