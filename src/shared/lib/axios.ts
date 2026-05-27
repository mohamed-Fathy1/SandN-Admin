import axios, { type AxiosError } from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/features/auth/store/auth-store';

export class ApiError extends Error {
  statusCode: number;
  errors: Array<{ message: string; path: string[]; type: string }>;

  constructor(
    message: string,
    statusCode: number,
    errors: Array<{ message: string; path: string[]; type: string }> = []
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ValidationIssue {
  message: string;
  path: string[];
  type: string;
}

interface ApiErrorPayload {
  message?: string;
  errors?: ValidationIssue[];
  error?: ValidationIssue[] | string | null;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const statusCode = error.response?.status ?? 500;
    const message =
      error.response?.data?.message ?? error.message ?? 'An unexpected error occurred';
    const payload = error.response?.data;
    const errors: ValidationIssue[] = payload?.errors
      ?? (Array.isArray(payload?.error) ? payload?.error : [])
      ?? [];

    if (statusCode === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    return Promise.reject(new ApiError(message, statusCode, errors));
  }
);
