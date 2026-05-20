import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/axios';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { registerEmail, activateAccount, resendCode } from '../api/auth';

export function useRegisterEmail() {
  return useMutation({
    mutationFn: (email: string) => registerEmail(email),
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error('Failed to send code');
    },
  });
}

export function useActivateAccount() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (payload: { email: string; activeCode: string }) => {
      const token = await activateAccount(payload);
      setSession({ token, email: payload.email });
      return token;
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error('Failed to verify code');
    },
  });
}

export function useResendCode() {
  return useMutation({
    mutationFn: (email: string) => resendCode(email),
    onSuccess: () => {
      toast.success('New code sent');
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error('Failed to resend code');
    },
  });
}
