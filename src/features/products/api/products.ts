import { api } from '@/shared/lib/axios';
import type { ApiResponse, BilingualText } from '@/shared/types';
import type { ApiProduct, ApiProductAnalysis, ApiProductListResponse } from '@/shared/types/api';

export interface VariantPayload {
  size: string;
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
  subCategory: string;
  defaultImage: string;
  albumImages: string[];
  sizeChartImage?: string;
  variants: VariantPayload[];
}

interface ProductSingleResponse {
  product: ApiProduct;
}

export async function fetchProducts(page: number): Promise<ApiProductListResponse> {
  const { data } = await api.get<ApiResponse<ApiProductListResponse>>(
    `/product/get-all-products?page=${page}`
  );
  return data.data;
}

export async function searchProducts(query: string): Promise<ApiProduct[]> {
  const { data } = await api.get<ApiResponse<{ products: ApiProduct[] }>>(
    `/product/search?searchQuery=${encodeURIComponent(query)}`
  );
  return data.data.products;
}

export async function fetchProduct(id: string): Promise<ApiProduct> {
  const { data } = await api.get<ApiResponse<ProductSingleResponse>>(
    `/product/get-one-product/${id}`
  );
  return data.data.product;
}

export async function fetchProductAnalysis(): Promise<ApiProductAnalysis> {
  const { data } = await api.get<ApiResponse<ApiProductAnalysis>>('/product/get-analysis');
  return data.data;
}

export async function createProduct(payload: ProductPayload): Promise<ApiProduct> {
  const { data } = await api.post<ApiResponse<ProductSingleResponse>>('/product/create', payload);
  return data.data.product;
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>
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
