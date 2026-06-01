import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime, formatEGP, formatNumber } from '@/shared/utils/format';

/**
 * Subscribes to the active locale via `useTranslation` so components re-render
 * on language change, then exposes the same formatters from `format.ts`.
 *
 * Prefer this hook in components that render money / dates / counts but don't
 * already call `useTranslation` for their own strings. Components that do call
 * `useTranslation` can keep importing the standalone functions — they re-render
 * on language change for free.
 */
export function useFormatters() {
  // Touching i18n.language tracks it for re-renders.
  const { i18n } = useTranslation();
  void i18n.language;
  return { formatEGP, formatNumber, formatDate, formatDateTime };
}
