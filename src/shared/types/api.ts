import type { BilingualText } from './index';
import type { OrderStatus, OfferType, GroupName, HeroImageType } from '@/config/constants';

/**
 * Denormalized media document the backend returns on GETs.
 * Writes still take a plain URL string (e.g. `imageUrl`, `defaultImage`).
 */
export interface Media {
  mediaUrl: string;
  mediaId: string;
}

export interface ApiGroup {
  _id: string;
  name: GroupName | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiSize {
  _id: string;
  size: string;
  order: number;
  groupSize: string | ApiGroup;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiColor {
  _id: string;
  name: BilingualText;
  hex: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCategoryIcon {
  _id: string;
  key: string;
  svg: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Shape of an icon returned *populated* on a Category. Per the API spec, only
 * `key` and `svg` are guaranteed — the icon resource fields (`_id`, `isActive`)
 * may be missing in this nested context.
 */
export interface PopulatedCategoryIcon {
  _id?: string;
  key: string;
  svg: string;
  isActive?: boolean;
}

export interface ApiCategory {
  _id: string;
  name: BilingualText;
  image: Media;
  groupSize: string | ApiGroup;
  iconId?: string | null;
  icon?: PopulatedCategoryIcon | null;
  subCategories?: ApiSubCategory[];
  sizeCategories?: ApiSize[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiSubCategory {
  _id: string;
  name: BilingualText;
  image: Media;
  groupSize: string | ApiGroup;
  category: string | ApiCategory;
  sizeCategories?: ApiSize[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiShipping {
  _id: string;
  name: BilingualText;
  cost: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiVariant {
  _id: string;
  size: string;
  color: string | ApiColor;
  quantity: number;
  product?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiProduct {
  _id: string;
  name: BilingualText;
  description: BilingualText;
  price: number;
  wholesalePrice: number;
  salePrice: number;
  saleStartDate: number;
  saleEndDate: number;
  finalPrice?: number;
  isSale?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isSoldOut?: boolean;
  soldItems?: number;
  category: string | ApiCategory | null;
  subCategory: string | ApiSubCategory;
  defaultImage: Media;
  albumImages: Media[];
  sizeChartImage?: Media | null;
  variants?: ApiVariant[];
  isDeleted?: boolean;
  createdAt?: number | string;
  updatedAt?: number | string;
}

export interface ApiProductListResponse {
  products: ApiProduct[];
  currentPage: number;
  totalPages: number;
  totalItems?: number;
}

export interface ApiProductFilters {
  page?: number;
  category?: string;
  subCategory?: string;
  isSale?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isSoldOut?: boolean;
  isDeleted?: boolean;
}

export interface ApiHeroImage extends Media {
  imageType: HeroImageType;
}

export interface ApiHeroSection {
  _id: string;
  images: {
    image1: ApiHeroImage;
    image2: ApiHeroImage;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiSocialReview {
  _id: string;
  image: Media;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiOffer {
  _id: string;
  type: OfferType;
  isActive: boolean;
  image: Media;
  description: BilingualText;
  minOrderAmount: number;
  discountAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiOrderProduct {
  productId: string | ApiProduct;
  variantId: string | ApiVariant;
  quantity: number;
  price: number;
  name?: BilingualText;
  image?: Media | string;
  size?: string;
  /**
   * Per the API spec, `color` on order products is the populated color document
   * (name + hex) but legacy orders may still carry a plain ObjectId string.
   */
  color?: string | ApiColor;
}

export interface ApiOrder {
  _id: string;
  orderNumber: string;
  customer: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    address: string;
    apartmentSuite?: string;
    shipping: string | ApiShipping;
    postalCode: string;
    additionalPhone?: string;
    email?: string;
  };
  customerPhone?: string;
  products: ApiOrderProduct[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPresignedUrlResponse {
  preSignedURL: string;
  mediaUrl: string;
}

export interface ApiWishlistCustomer {
  _id: string;
  phone?: string;
  email?: string;
}

export interface ApiWishlistEntry {
  product: ApiProduct;
  customer: ApiWishlistCustomer;
  createdAt: number | string;
}

export interface ApiWishlistPage {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  products: ApiWishlistEntry[];
}

export interface AnalysisTopSellingProduct {
  _id: string;
  name: BilingualText;
  defaultImage?: Media | null;
  finalPrice?: number;
  soldItems: number;
}

export interface AnalysisWishlistedProduct {
  count: number;
  product: {
    _id: string;
    name: BilingualText;
    defaultImage?: Media | null;
    finalPrice?: number;
  };
}

export interface AnalysisDailyOrders {
  _id: string;
  total: number;
  orders: number;
}

export interface ApiProductAnalysis {
  products: {
    total: number;
    soldOut: number;
    topSelling: AnalysisTopSellingProduct[];
    mostWishlisted: AnalysisWishlistedProduct[];
    totalFinalPrice: number;
    totalWholesalePrice: number;
  };
  categories: {
    total: number;
    subCategories: number;
  };
  orders: {
    total: number;
    todaySales: number;
    todayOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    byStatus: Partial<Record<OrderStatus, number>>;
    last7Days: AnalysisDailyOrders[];
  };
  customers: {
    total: number;
  };
}
