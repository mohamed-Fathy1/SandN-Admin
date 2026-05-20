import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/config/constants';

export interface AuthSession {
  token: string;
  email: string;
}

interface AuthStore {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      logout: () => set({ session: null }),
    }),
    { name: STORAGE_KEYS.session }
  )
);

export const selectIsAuthenticated = (state: AuthStore) => state.session !== null;
export const selectSessionEmail = (state: AuthStore) => state.session?.email ?? null;
