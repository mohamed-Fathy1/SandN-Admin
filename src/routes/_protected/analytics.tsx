import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';
import { analyticsSearchSchema } from '@/features/analytics/lib/range';
import type { AnalyticsTab } from '@/designs/analytics/analytics-page';
import type { AnalyticsParams, ClarityDimension } from '@/shared/types/api';

const AnalyticsPage = lazy(() =>
  import('@/designs/analytics/analytics-page').then((m) => ({ default: m.AnalyticsPage }))
);

export const Route = createFileRoute('/_protected/analytics')({
  validateSearch: analyticsSearchSchema,
  component: AnalyticsRouteComponent,
});

function AnalyticsRouteComponent() {
  const { startDate, endDate, tab, dimension } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnalyticsPage
        tab={tab}
        onTabChange={(next: AnalyticsTab) =>
          navigate({ search: (prev) => ({ ...prev, tab: next }) })
        }
        range={{ startDate, endDate }}
        onRangeChange={(range: AnalyticsParams) =>
          navigate({
            search: (prev) => ({ ...prev, startDate: range.startDate, endDate: range.endDate }),
          })
        }
        dimension={dimension}
        onDimensionChange={(next: ClarityDimension) =>
          navigate({ search: (prev) => ({ ...prev, dimension: next }) })
        }
      />
    </Suspense>
  );
}
