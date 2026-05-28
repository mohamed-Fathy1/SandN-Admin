import { api } from '@/shared/lib/axios';
import type { ApiResponse, BilingualText } from '@/shared/types';
import type {
  ApiProduct,
  ApiProductAnalysis,
  ApiProductFilters,
  ApiProductListResponse,
} from '@/shared/types/api';

export interface VariantPayload {
  size?: string;
  color: string;
  quantity: number;
}

export interface ProductPayload {
  name: BilingualText;
  description: BilingualText;
  price: number;
  wholesalePrice: number;
  salePrice: number;
  saleStartDate: number;
  saleEndDate: number;
  category: string;
  subCategory?: string;
  defaultImage: string;
  albumImages: string[];
  sizeChartImage?: string | null;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  variants: VariantPayload[];
}

export type ProductUpdatePayload = Partial<ProductPayload>;

interface ProductSingleResponse {
  product: ApiProduct;
}

function buildFilterQuery(filters: ApiProductFilters): string {
  const params = new URLSearchParams();
  if (filters.page != null) params.set('page', String(filters.page));
  if (filters.category) params.set('category', filters.category);
  if (filters.subCategory) params.set('subCategory', filters.subCategory);
  if (filters.isSale != null) params.set('isSale', String(filters.isSale));
  if (filters.isNewArrival != null) params.set('isNewArrival', String(filters.isNewArrival));
  if (filters.isBestSeller != null) params.set('isBestSeller', String(filters.isBestSeller));
  if (filters.isSoldOut != null) params.set('isSoldOut', String(filters.isSoldOut));
  if (filters.isDeleted != null) params.set('isDeleted', String(filters.isDeleted));
  return params.toString();
}

export async function fetchProducts(
  filters: ApiProductFilters = {}
): Promise<ApiProductListResponse> {
  const qs = buildFilterQuery({ page: 1, ...filters });
  const { data } = await api.get<ApiResponse<ApiProductListResponse>>(
    `/product/get-all-products?${qs}`
  );
  return (
    data.data ?? {
      products: [],
      currentPage: filters.page ?? 1,
      totalPages: 0,
      totalItems: 0,
    }
  );
}

export async function searchProducts(query: string): Promise<ApiProduct[]> {
  const { data } = await api.get<ApiResponse<{ products: ApiProduct[] }>>(
    `/product/search?searchQuery=${encodeURIComponent(query)}`
  );
  return data.data?.products ?? [];
}

export async function fetchProduct(id: string): Promise<ApiProduct> {
  const { data } = await api.get<ApiResponse<ProductSingleResponse>>(
    `/product/get-one-product/${id}`
  );
  return data.data.product;
}

export async function fetchProductAnalysis(): Promise<ApiProductAnalysis> {
  const { data } = await api.get<ApiResponse<{ analysis: ApiProductAnalysis }>>(
    '/product/get-analysis'
  );
  return data.data.analysis;
}

export async function createProduct(payload: ProductPayload): Promise<ApiProduct> {
  const { data } = await api.post<ApiResponse<ProductSingleResponse>>('/product/create', payload);
  return data.data.product;
}

export async function updateProduct(
  id: string,
  payload: ProductUpdatePayload
): Promise<ApiProduct> {
  const { data } = await api.patch<ApiResponse<ProductSingleResponse>>(
    `/product/update/${id}`,
    payload
  );
  return data.data.product;
}

export async function softDeleteProduct(id: string): Promise<void> {
  await api.patch(`/product/soft-delete/${id}`);
}

export async function restoreProduct(id: string): Promise<void> {
  await api.patch(`/product/restore/${id}`);
}

export async function hardDeleteProduct(id: string): Promise<void> {
  await api.delete(`/product/hard-delete/${id}`);
}
