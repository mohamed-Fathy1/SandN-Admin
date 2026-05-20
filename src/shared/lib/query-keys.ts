import type { OrderStatus } from '@/config/constants';

export interface ProductsListParams {
  page?: number;
  search?: string;
}

export interface OrdersListParams {
  page?: number;
  status?: OrderStatus;
  search?: string;
}

export interface WishlistParams {
  page?: number;
}

export const adminQueryKeys = {
  products: {
    all: ['admin', 'products'] as const,
    list: (params: ProductsListParams) => ['admin', 'products', 'list', params] as const,
    detail: (id: string) => ['admin', 'products', 'detail', id] as const,
    search: (q: string) => ['admin', 'products', 'search', q] as const,
    analysis: ['admin', 'products', 'analysis'] as const,
    deleted: ['admin', 'products', 'deleted'] as const,
  },
  variants: {
    byProduct: (productId: string) => ['admin', 'variants', 'by-product', productId] as const,
    detail: (id: string) => ['admin', 'variants', 'detail', id] as const,
  },
  categories: {
    all: ['admin', 'categories'] as const,
    deleted: ['admin', 'categories', 'deleted'] as const,
    detail: (id: string) => ['admin', 'categories', 'detail', id] as const,
  },
  subCategories: {
    all: ['admin', 'sub-categories'] as const,
    deleted: ['admin', 'sub-categories', 'deleted'] as const,
    detail: (id: string) => ['admin', 'sub-categories', 'detail', id] as const,
  },
  colors: {
    all: ['admin', 'colors'] as const,
    detail: (id: string) => ['admin', 'colors', 'detail', id] as const,
  },
  groups: {
    all: ['admin', 'groups'] as const,
    detail: (id: string) => ['admin', 'groups', 'detail', id] as const,
  },
  sizes: {
    all: ['admin', 'sizes'] as const,
    byGroup: (groupId: string) => ['admin', 'sizes', 'by-group', groupId] as const,
    detail: (id: string) => ['admin', 'sizes', 'detail', id] as const,
  },
  shipping: {
    all: ['admin', 'shipping'] as const,
    detail: (id: string) => ['admin', 'shipping', 'detail', id] as const,
  },
  orders: {
    all: ['admin', 'orders'] as const,
    list: (params: OrdersListParams) => ['admin', 'orders', 'list', params] as const,
    detail: (id: string) => ['admin', 'orders', 'detail', id] as const,
  },
  hero: {
    all: ['admin', 'hero'] as const,
    detail: (id: string) => ['admin', 'hero', 'detail', id] as const,
  },
  socialReviews: {
    all: ['admin', 'social-reviews'] as const,
    detail: (id: string) => ['admin', 'social-reviews', 'detail', id] as const,
  },
  offers: {
    all: ['admin', 'offers'] as const,
    detail: (id: string) => ['admin', 'offers', 'detail', id] as const,
  },
  wishlist: {
    list: (params: WishlistParams) => ['admin', 'wishlist', 'list', params] as const,
  },
} as const;
