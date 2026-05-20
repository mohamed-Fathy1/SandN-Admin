import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { OtpPage } from '@/designs/auth/otp-page';
import { useAuthStore } from '@/features/auth/store/auth-store';

const otpSearchSchema = z.object({
  email: z.string().email(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login_/verify')({
  validateSearch: otpSearchSchema,
  beforeLoad: () => {
    if (useAuthStore.getState().session) {
      throw redirect({ to: '/' });
    }
  },
  component: OtpPage,
});
