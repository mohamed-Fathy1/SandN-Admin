export const STORAGE_KEYS = {
  session: 'sn_admin_session',
  sidebar: 'sn_admin_sidebar',
  locale: 'sn_admin_locale',
} as const;

export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

export const QUERY_STALE_TIME = {
  short: 30 * 1000,
  default: 5 * 60 * 1000,
  long: 30 * 60 * 1000,
} as const;

export const PAGINATION = {
  defaultPageSize: 10,
  ordersPageSize: 10,
  wishlistPageSize: 20,
} as const;

export const S3_FOLDERS = [
  'Offers',
  'ImageSlider',
  'Category',
  'SubCategory',
  'SocialReview',
  'Product',
  'PaymentReceipts',
] as const;

export type S3Folder = (typeof S3_FOLDERS)[number];

// Listed in linear progression per the API spec:
//   under_review (initial) → confirmed → ordered → shipped → delivered
// followed by the terminal off-path states cancelled / deleted.
export const ORDER_STATUSES = [
  'under_review',
  'confirmed',
  'ordered',
  'shipped',
  'delivered',
  'cancelled',
  'deleted',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ─────────────────────────── Order payment / deposit ───────────────────────────
// Payment status is tracked independently from the order (fulfilment) status above.
export const PAYMENT_METHODS = [
  'instapay',
  'vodafone_cash',
  'bank_transfer',
  'cash',
  'other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'partially_paid',
  'paid',
  'refund_pending',
  'refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_TXN_TYPES = ['deposit', 'balance_on_delivery', 'refund'] as const;
export type PaymentTxnType = (typeof PAYMENT_TXN_TYPES)[number];

export const OFFER_TYPES = ['fixed_discount', 'free_shipping'] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const HERO_IMAGE_TYPES = ['small', 'large'] as const;
export type HeroImageType = (typeof HERO_IMAGE_TYPES)[number];

export const UPLOAD_LIMITS = {
  maxImageSizeBytes: 5 * 1024 * 1024,
  acceptedImageTypes: 'image/jpeg,image/jpg,image/png,image/webp',
} as const;

export const CURRENCY_CODE = 'EGP';
export const CURRENCY_SUFFIX = CURRENCY_CODE;

/**
 * Public storefront origin (customer-facing site). Used to turn GA4 page paths
 * (e.g. `/products/<id>`) into clickable live links. No trailing slash, so
 * `STOREFRONT_URL + pagePath` never produces a doubled `//`.
 */
export const STOREFRONT_URL = 'https://sn-lingerie.com';

export const ROUTES = {
  login: '/login',
  loginVerify: '/login/verify',
  dashboard: '/',
  products: '/products',
  productsNew: '/products/new',
  productDetail: (id: string) => `/products/${id}`,
  productVariants: (id: string) => `/products/${id}/variants`,
  categories: '/catalog/categories',
  subCategories: '/catalog/sub-categories',
  categoryIcons: '/catalog/icons',
  colors: '/catalog/colors',
  groups: '/catalog/groups',
  sizes: '/catalog/sizes',
  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  hero: '/content/hero',
  socialReviews: '/content/social-reviews',
  offers: '/offers',
  shipping: '/shipping',
  wishlist: '/wishlist',
  backups: '/maintenance/backups',
  analytics: '/analytics',
} as const;
