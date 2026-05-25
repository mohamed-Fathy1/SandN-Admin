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
  name: GroupName;
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

export interface ApiCategory {
  _id: string;
  name: BilingualText;
  image: Media;
  groupSize: string | ApiGroup;
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
  category: string | ApiCategory | null;
  subCategory: string | ApiSubCategory;
  defaultImage: Media;
  albumImages: Media[];
  sizeChartImage?: Media;
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

export interface ApiHeroImage extends Media {
  mediaType: HeroImageType;
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
  color?: string;
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
  uploadUrl: string;
  fileUrl: string;
}

export interface ApiWishlistItem {
  _id: string;
  product: ApiProduct;
  customer: string;
  createdAt: string;
}

export interface ApiProductAnalysis {
  total: number;
  active?: number;
  deleted?: number;
}
