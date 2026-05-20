import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { categoryHandlers } from './handlers/categories';
import { s3Handlers } from './handlers/s3';
import { ordersHandlers } from './handlers/orders';
import { offersHandlers } from './handlers/offers';
import { shippingHandlers } from './handlers/shipping';
import { heroHandlers } from './handlers/hero';
import { socialReviewHandlers } from './handlers/social-reviews';
import { wishlistHandlers } from './handlers/wishlist';

export const server = setupServer(
  ...authHandlers,
  ...categoryHandlers,
  ...s3Handlers,
  ...ordersHandlers,
  ...offersHandlers,
  ...shippingHandlers,
  ...heroHandlers,
  ...socialReviewHandlers,
  ...wishlistHandlers
);
