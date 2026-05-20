import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const ShippingPage = lazy(() =>
  import('@/designs/marketing/shipping-page').then((m) => ({ default: m.ShippingPage }))
);

export const Route = createFileRoute('/_protected/shipping')({
  component: ShippingRoute,
});

function ShippingRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ShippingPage />
    </Suspense>
  );
}
