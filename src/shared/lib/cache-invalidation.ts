import type { QueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from './query-keys';

/**
 * Centralized cache invalidators — every mutation hook calls one of these.
 * Never inline `queryClient.invalidateQueries` in a feature hook.
 */
export const invalidators = {
  afterProductWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.products.all });
    qc.invalidateQueries({ queryKey: adminQueryKeys.products.analysis });
  },
  afterProductDetail: (qc: QueryClient, productId: string) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.products.all });
    qc.invalidateQueries({ queryKey: adminQueryKeys.products.detail(productId) });
    qc.invalidateQueries({ queryKey: adminQueryKeys.products.analysis });
  },
  afterVariantWrite: (qc: QueryClient, productId: string) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.variants.byProduct(productId) });
    qc.invalidateQueries({ queryKey: adminQueryKeys.products.detail(productId) });
  },
  afterCategoryWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.categories.all });
    qc.invalidateQueries({ queryKey: adminQueryKeys.categories.deleted });
    qc.invalidateQueries({ queryKey: adminQueryKeys.subCategories.all });
  },
  afterCategoryIconWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.categoryIcons.all });
    qc.invalidateQueries({ queryKey: adminQueryKeys.categories.all });
  },
  afterSubCategoryWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.subCategories.all });
    qc.invalidateQueries({ queryKey: adminQueryKeys.subCategories.deleted });
  },
  afterColorWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.colors.all });
  },
  afterGroupWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.groups.all });
    qc.invalidateQueries({ queryKey: adminQueryKeys.sizes.all });
  },
  afterSizeWrite: (qc: QueryClient, groupId?: string) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.sizes.all });
    if (groupId) {
      qc.invalidateQueries({ queryKey: adminQueryKeys.sizes.byGroup(groupId) });
    }
  },
  afterShippingWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.shipping.all });
  },
  afterOrderWrite: (qc: QueryClient, orderId: string) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.orders.all });
    qc.invalidateQueries({ queryKey: adminQueryKeys.orders.detail(orderId) });
  },
  afterHeroWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.hero.all });
  },
  afterSocialReviewWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.socialReviews.all });
  },
  afterOfferWrite: (qc: QueryClient) => {
    qc.invalidateQueries({ queryKey: adminQueryKeys.offers.all });
  },
};
