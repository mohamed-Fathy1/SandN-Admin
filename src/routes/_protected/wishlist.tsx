import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { z } from 'zod';
import { PageSkeleton } from '@/designs/shared';

const WishlistPage = lazy(() =>
  import('@/designs/operations/wishlist-page').then((m) => ({ default: m.WishlistPage }))
);

const wishlistSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
});

export const Route = createFileRoute('/_protected/wishlist')({
  validateSearch: wishlistSearchSchema,
  component: WishlistRouteComponent,
});

function WishlistRouteComponent() {
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WishlistPage
        page={page}
        onPageChange={(next) => navigate({ search: (s) => ({ ...s, page: next }) })}
      />
    </Suspense>
  );
}
