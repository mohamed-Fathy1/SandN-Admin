import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const GroupsPage = lazy(() =>
  import('@/designs/catalog/groups-page').then((m) => ({ default: m.GroupsPage }))
);

export const Route = createFileRoute('/_protected/catalog/groups')({
  component: () => (
    <Suspense fallback={<PageSkeleton />}>
      <GroupsPage />
    </Suspense>
  ),
});
