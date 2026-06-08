import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const BackupsPage = lazy(() =>
  import('@/designs/maintenance/backups-page').then((m) => ({ default: m.BackupsPage }))
);

export const Route = createFileRoute('/_protected/maintenance/backups')({
  component: BackupsRoute,
});

function BackupsRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BackupsPage />
    </Suspense>
  );
}
