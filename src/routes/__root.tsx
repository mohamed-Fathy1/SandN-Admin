import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { logoutAndRedirect } from '@/features/auth/lib/logout';

function RootShell() {
  useEffect(() => {
    const handler = () => {
      toast.warning('Session expired. Please sign in again.');
      logoutAndRedirect();
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Outlet />
    </>
  );
}

export const Route = createRootRoute({
  component: RootShell,
});
