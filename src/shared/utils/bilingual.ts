import type { BilingualText } from '@/shared/types';
import i18n from '@/i18n';

export function toEN(text: BilingualText | undefined | null): string {
  return text?.en ?? '';
}

export function toAR(text: BilingualText | undefined | null): string {
  return text?.ar ?? '';
}

/**
 * Localized accessor for bilingual fields. Falls back to the other language
 * when the active one is empty, so tables never show a blank cell.
 */
export function toLocalized(text: BilingualText | undefined | null): string {
  if (!text) return '';
  const lng = (i18n.language || 'ar').slice(0, 2);
  if (lng === 'ar') return text.ar?.trim() || text.en?.trim() || '';
  return text.en?.trim() || text.ar?.trim() || '';
}

export function isBilingualFilled(text: BilingualText | undefined | null): boolean {
  return Boolean(text?.en?.trim() && text?.ar?.trim());
}

export const emptyBilingual = (): BilingualText => ({ ar: '', en: '' });
