import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { logoutAndRedirect } from '@/features/auth/lib/logout';
import { useLocaleEffect } from '@/shared/hooks/use-locale-effect';
import type { AuthExpiredDetail, AuthExpiredReason } from '@/shared/lib/axios';

const EXPIRED_KEYS: Record<AuthExpiredReason, string> = {
  missing: 'session.signInRequired',
  expired: 'session.expired',
  invalid: 'session.invalid',
  payload: 'session.invalid',
  revoked: 'session.revoked',
};

function RootShell() {
  useLocaleEffect();
  const { t } = useTranslation('common');

  useEffect(() => {
    const expired = (e: Event) => {
      const detail = (e as CustomEvent<AuthExpiredDetail>).detail;
      const reason = detail?.reason ?? 'invalid';
      toast.warning(t(EXPIRED_KEYS[reason]));
      logoutAndRedirect();
    };
    const forbidden = () => {
      toast.error(t('session.forbidden'));
    };
    const misconfigured = () => {
      toast.error(t('session.serverError'));
    };
    window.addEventListener('auth:expired', expired);
    window.addEventListener('auth:forbidden', forbidden);
    window.addEventListener('server:misconfigured', misconfigured);
    return () => {
      window.removeEventListener('auth:expired', expired);
      window.removeEventListener('auth:forbidden', forbidden);
      window.removeEventListener('server:misconfigured', misconfigured);
    };
  }, [t]);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        {t('skipToContent')}
      </a>
      <Outlet />
    </>
  );
}

export const Route = createRootRoute({
  component: RootShell,
});
