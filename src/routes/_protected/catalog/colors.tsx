import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const ColorsPage = lazy(() =>
  import('@/designs/catalog/colors-page').then((m) => ({ default: m.ColorsPage }))
);

export const Route = createFileRoute('/_protected/catalog/colors')({
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <ColorsPage />
    </Suspense>
  ),
});
