import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@/config/constants';
import { useLocaleStore } from '@/shared/stores/locale-store';

const dirFor = (locale: Locale): 'rtl' | 'ltr' => (locale === 'ar' ? 'rtl' : 'ltr');

export function useLocaleEffect() {
  const locale = useLocaleStore((s) => s.locale);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    const html = document.documentElement;
    html.lang = locale;
    html.dir = dirFor(locale);
  }, [locale, i18n]);
}
