import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { logoutAndRedirect } from '@/features/auth/lib/logout';
import type { AuthExpiredDetail, AuthExpiredReason } from '@/shared/lib/axios';

const EXPIRED_MESSAGES: Record<AuthExpiredReason, string> = {
  missing: 'Please sign in to continue.',
  expired: 'Your session expired. Please sign in again.',
  invalid: 'Your session is invalid. Please sign in again.',
  payload: 'Your session is invalid. Please sign in again.',
  revoked: 'Your session was revoked. Please sign in again.',
};

function RootShell() {
  useEffect(() => {
    const expired = (e: Event) => {
      const detail = (e as CustomEvent<AuthExpiredDetail>).detail;
      const reason = detail?.reason ?? 'invalid';
      toast.warning(EXPIRED_MESSAGES[reason]);
      logoutAndRedirect();
    };
    const forbidden = () => {
      toast.error("You don't have permission to perform this action.");
    };
    const misconfigured = () => {
      toast.error('Server error. Please try again later or contact support.');
    };
    window.addEventListener('auth:expired', expired);
    window.addEventListener('auth:forbidden', forbidden);
    window.addEventListener('server:misconfigured', misconfigured);
    return () => {
      window.removeEventListener('auth:expired', expired);
      window.removeEventListener('auth:forbidden', forbidden);
      window.removeEventListener('server:misconfigured', misconfigured);
    };
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
