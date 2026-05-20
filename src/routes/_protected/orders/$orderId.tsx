import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const OrderDetailPage = lazy(() =>
  import('@/designs/orders/order-detail-page').then((m) => ({ default: m.OrderDetailPage }))
);

export const Route = createFileRoute('/_protected/orders/$orderId')({
  component: OrderDetailRoute,
});

function OrderDetailRoute() {
  const { orderId } = Route.useParams();
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrderDetailPage orderId={orderId} />
    </Suspense>
  );
}
