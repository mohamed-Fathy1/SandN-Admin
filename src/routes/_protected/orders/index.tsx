import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { z } from 'zod';
import { PageSkeleton } from '@/designs/shared';
import { ORDER_STATUSES } from '@/config/constants';

const OrdersListPage = lazy(() =>
  import('@/designs/orders/orders-list-page').then((m) => ({ default: m.OrdersListPage }))
);

const ordersSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  search: z.string().catch(''),
});

export const Route = createFileRoute('/_protected/orders/')({
  validateSearch: ordersSearchSchema,
  component: OrdersRouteComponent,
});

function OrdersRouteComponent() {
  const { page, status, search } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersListPage
        page={page}
        status={status}
        search={search}
        onPageChange={(next) => navigate({ search: (s) => ({ ...s, page: next }) })}
        onStatusChange={(next) =>
          navigate({ search: (s) => ({ ...s, status: next, page: 1 }) })
        }
        onSearchChange={(next) =>
          navigate({ search: (s) => ({ ...s, search: next, page: 1 }) })
        }
      />
    </Suspense>
  );
}
