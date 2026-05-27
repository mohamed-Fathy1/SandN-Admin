import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const IconsPage = lazy(() =>
  import('@/designs/catalog/icons-page').then((m) => ({ default: m.IconsPage }))
);

export const Route = createFileRoute('/_protected/catalog/icons')({
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <IconsPage />
    </Suspense>
  ),
});
