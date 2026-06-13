import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';
import { analyticsSearchSchema } from '@/features/analytics/lib/range';
import type { AnalyticsParams } from '@/shared/types/api';

const AnalyticsPage = lazy(() =>
  import('@/designs/analytics/analytics-page').then((m) => ({ default: m.AnalyticsPage }))
);

export const Route = createFileRoute('/_protected/analytics')({
  validateSearch: analyticsSearchSchema,
  component: AnalyticsRouteComponent,
});

function AnalyticsRouteComponent() {
  const { startDate, endDate } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnalyticsPage
        range={{ startDate, endDate }}
        onRangeChange={(range: AnalyticsParams) =>
          navigate({ search: () => ({ startDate: range.startDate, endDate: range.endDate }) })
        }
      />
    </Suspense>
  );
}
