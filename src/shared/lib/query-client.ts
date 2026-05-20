import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './axios';
import { QUERY_STALE_TIME } from '@/config/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME.default,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.statusCode === 401 || error.statusCode === 404) return false;
          if (error.statusCode >= 400 && error.statusCode < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
