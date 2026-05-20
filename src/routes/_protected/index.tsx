import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const DashboardPage = lazy(() =>
  import('@/designs/dashboard/dashboard-page').then((m) => ({ default: m.DashboardPage }))
);

export const Route = createFileRoute('/_protected/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardPage />
    </Suspense>
  );
}
