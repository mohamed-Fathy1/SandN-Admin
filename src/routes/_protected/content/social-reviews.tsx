import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/designs/shared';

const SocialReviewsPage = lazy(() =>
  import('@/designs/marketing/social-reviews-page').then((m) => ({
    default: m.SocialReviewsPage,
  }))
);

export const Route = createFileRoute('/_protected/content/social-reviews')({
  component: SocialReviewsRoute,
});

function SocialReviewsRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SocialReviewsPage />
    </Suspense>
  );
}
