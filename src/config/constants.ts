export const STORAGE_KEYS = {
  session: 'sn_admin_session',
  sidebar: 'sn_admin_sidebar',
} as const;

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

export const OFFER_TYPES = ['fixed_discount', 'free_shipping'] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const GROUP_NAMES = ['letters', 'numeric'] as const;
export type GroupName = (typeof GROUP_NAMES)[number];

export const HERO_IMAGE_TYPES = ['small', 'large'] as const;
export type HeroImageType = (typeof HERO_IMAGE_TYPES)[number];

export const UPLOAD_LIMITS = {
  maxImageSizeBytes: 5 * 1024 * 1024,
  acceptedImageTypes: 'image/jpeg,image/jpg,image/png,image/webp',
} as const;

export const CURRENCY_CODE = 'EGP';
export const CURRENCY_SUFFIX = CURRENCY_CODE;

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
} as const;
