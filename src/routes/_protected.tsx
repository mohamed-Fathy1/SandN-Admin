import { createFileRoute, redirect } from '@tanstack/react-router';
import { AdminLayout } from '@/designs/layout';
import { useAuthStore } from '@/features/auth/store/auth-store';

export const Route = createFileRoute('/_protected')({
  beforeLoad: ({ location }) => {
    const session = useAuthStore.getState().session;
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AdminLayout,
});
