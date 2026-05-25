import { useState } from 'react';
import { X } from 'lucide-react';
import {
  AdminImageUploader,
  Card,
  CardGridSkeleton,
  ConfirmDialog,
  ImageAddTile,
  QueryErrorState,
} from '@/designs/shared';
import { PageHeader } from '@/designs/layout/page-header';
import {
  useCreateSocialReview,
  useDeleteSocialReview,
  useSocialReviews,
} from '@/features/social-reviews/hooks/use-social-reviews';
import type { ApiSocialReview } from '@/shared/types/api';

export function SocialReviewsPage() {
  const [deleting, setDeleting] = useState<ApiSocialReview | null>(null);
  const reviewsQuery = useSocialReviews();
  const createReview = useCreateSocialReview();
  const deleteReview = useDeleteSocialReview();

  const reviews = reviewsQuery.data ?? [];
  const hasReviews = reviews.length > 0;

  return (
    <>
      <PageHeader
        title="Social Reviews"
        subtitle="Social-proof images shown on the storefront. Drag to add or click the tile."
      />

      {reviewsQuery.isPending ? (
        <CardGridSkeleton count={8} cols={4} />
      ) : reviewsQuery.isError ? (
        <QueryErrorState error={reviewsQuery.error} onRetry={() => reviewsQuery.refetch()} />
      ) : !hasReviews ? (
        <div className="mx-auto max-w-md text-center">
          <h3 className="font-display text-2xl italic text-foreground">No reviews yet</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Upload your first social proof image to start a feed.
          </p>
          <div className="mt-6">
            <AdminImageUploader
              folder="SocialReview"
              onChange={(fileUrl) => createReview.mutate(fileUrl)}
              aspectRatio="3 / 2"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review) => (
            <Card key={review._id} padding="none" className="group relative overflow-hidden">
              <img
                src={review.image?.mediaUrl}
                alt="Social review"
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setDeleting(review)}
                aria-label="Delete social review"
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </Card>
          ))}
          <ImageAddTile
            folder="SocialReview"
            onUploaded={(fileUrl) => createReview.mutate(fileUrl)}
          />
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this review?"
        description="It will disappear from the storefront social section."
        confirmLabel="Delete"
        isPending={deleteReview.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteReview.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}
