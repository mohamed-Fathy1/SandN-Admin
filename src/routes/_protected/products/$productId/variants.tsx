import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const VariantsPage = lazy(() =>
  import('@/designs/products/variants-page').then((m) => ({ default: m.VariantsPage }))
);

export const Route = createFileRoute('/_protected/products/$productId/variants')({
  component: VariantsRoute,
});

function VariantsRoute() {
  const { productId } = Route.useParams();
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VariantsPage productId={productId} />
    </Suspense>
  );
}
