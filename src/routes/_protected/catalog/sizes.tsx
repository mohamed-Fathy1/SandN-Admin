import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const SizesPage = lazy(() =>
  import('@/designs/catalog/sizes-page').then((m) => ({ default: m.SizesPage }))
);

export const Route = createFileRoute('/_protected/catalog/sizes')({
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <SizesPage />
    </Suspense>
  ),
});
