import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const ProductFormPage = lazy(() =>
  import('@/designs/products/product-form-page').then((m) => ({ default: m.ProductFormPage }))
);

export const Route = createFileRoute('/_protected/products/$productId/')({
  component: ProductEditRoute,
});

function ProductEditRoute() {
  const { productId } = Route.useParams();
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductFormPage productId={productId} />
    </Suspense>
  );
}
