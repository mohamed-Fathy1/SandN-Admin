import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';

interface ActivateResponse {
  accessToken: string;
}

export interface RegisterEmailResult {
  /** True only when the backend actually sent an activation code (admin emails). */
  codeSent: boolean;
  /** Server's human-readable message; reused for toast messaging. */
  message: string;
  statusCode: number;
}

export async function registerEmail(email: string): Promise<RegisterEmailResult> {
  const { data, status } = await api.post<ApiResponse<{ email?: string } | null>>(
    '/authentication/register-email',
    { email }
  );
  // Per spec: only the "email sent successfully" response carries `{ email }` in data.
  // 201 (new user) and the "Welcome email sent" non-admin path return `data: null`.
  const codeSent = Boolean(data?.data && typeof data.data === 'object' && 'email' in data.data);
  return {
    codeSent,
    message: data?.message ?? '',
    statusCode: data?.statusCode ?? status,
  };
}

export async function activateAccount(payload: {
  email: string;
  activeCode: string;
}): Promise<string> {
  const { data } = await api.post<ApiResponse<ActivateResponse>>(
    '/authentication/active-account',
    payload
  );
  return data.data.accessToken;
}

export async function resendCode(email: string): Promise<void> {
  await api.post<ApiResponse<null>>('/authentication/email-new-code', { email });
}
