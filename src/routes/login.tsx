import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginPage } from '@/designs/auth/login-page';
import { useAuthStore } from '@/features/auth/store/auth-store';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: () => {
    if (useAuthStore.getState().session) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});
