import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, STORAGE_KEYS, type Locale } from '@/config/constants';

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    { name: STORAGE_KEYS.locale }
  )
);

export const getStoredLocale = (): Locale => useLocaleStore.getState().locale;
