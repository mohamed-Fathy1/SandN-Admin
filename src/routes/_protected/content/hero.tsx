import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const HeroPage = lazy(() =>
  import('@/designs/marketing/hero-page').then((m) => ({ default: m.HeroPage }))
);

export const Route = createFileRoute('/_protected/content/hero')({
  component: HeroRoute,
});

function HeroRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HeroPage />
    </Suspense>
  );
}
