import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const OffersPage = lazy(() =>
  import('@/designs/marketing/offers-page').then((m) => ({ default: m.OffersPage }))
);

export const Route = createFileRoute('/_protected/offers')({
  component: OffersRoute,
});

function OffersRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OffersPage />
    </Suspense>
  );
}
