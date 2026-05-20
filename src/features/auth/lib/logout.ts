import { useAuthStore } from '@/features/auth/store/auth-store';

/**
 * Imperative logout: clears the session and force-reloads to /login.
 * Full reload is intentional — it clears in-memory React Query cache and
 * any other module-level singletons so no privileged data lingers in the SPA.
 */
export function logoutAndRedirect() {
  useAuthStore.getState().logout();
  window.location.href = '/login';
}
