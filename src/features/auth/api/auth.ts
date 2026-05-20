import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';

interface ActivateResponse {
  accessToken: string;
}

export async function registerEmail(email: string): Promise<void> {
  await api.post<ApiResponse<null>>('/authentication/register-email', { email });
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
