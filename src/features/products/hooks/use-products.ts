import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminQueryKeys } from '@/shared/lib/query-keys';
import { invalidators } from '@/shared/lib/cache-invalidation';
import { ApiError } from '@/shared/lib/axios';
import { QUERY_STALE_TIME } from '@/config/constants';
import type { ApiProductFilters } from '@/shared/types/api';
import {
  createProduct,
  fetchProduct,
  fetchProductAnalysis,
  fetchProducts,
  hardDeleteProduct,
  restoreProduct,
  searchProducts,
  softDeleteProduct,
  updateProduct,
} from '../api/products';

export function prefetchProduct(qc: QueryClient, id: string) {
  return qc.prefetchQuery({
    queryKey: adminQueryKeys.products.detail(id),
    queryFn: () => fetchProduct(id),
  });
}

export function useProducts(filters: ApiProductFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useProductSearch(query: string, enabled = true) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: adminQueryKeys.products.search(trimmed),
    queryFn: () => searchProducts(trimmed),
    enabled: enabled && trimmed.length >= 2,
    staleTime: QUERY_STALE_TIME.short,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.products.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useProduct called without id');
      return fetchProduct(id);
    },
    enabled: Boolean(id),
    staleTime: QUERY_STALE_TIME.default,
  });
}

export function useProductAnalysis() {
  return useQuery({
    queryKey: adminQueryKeys.products.analysis,
    queryFn: fetchProductAnalysis,
    staleTime: QUERY_STALE_TIME.short,
  });
}

function toastError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      invalidators.afterProductWrite(qc);
      toast.success('Product created');
    },
    onError: (err) => toastError(err, 'Failed to create product'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateProduct>[1];
    }) => updateProduct(id, payload),
    onSuccess: (_data, vars) => {
      invalidators.afterProductDetail(qc, vars.id);
      toast.success('Product updated');
    },
    onError: (err) => toastError(err, 'Failed to update product'),
  });
}

export function useSoftDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: softDeleteProduct,
    onSuccess: () => {
      invalidators.afterProductWrite(qc);
      toast.success('Product removed');
    },
    onError: (err) => toastError(err, 'Failed to remove product'),
  });
}

export function useRestoreProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      invalidators.afterProductWrite(qc);
      toast.success('Product restored');
    },
    onError: (err) => toastError(err, 'Failed to restore product'),
  });
}

export function useHardDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: hardDeleteProduct,
    onSuccess: () => {
      invalidators.afterProductWrite(qc);
      toast.success('Product deleted permanently');
    },
    onError: (err) => toastError(err, 'Failed to delete product'),
  });
}
