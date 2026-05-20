import type { BilingualText } from '@/shared/types';

export function toEN(text: BilingualText | undefined | null): string {
  return text?.en ?? '';
}

export function toAR(text: BilingualText | undefined | null): string {
  return text?.ar ?? '';
}

export function isBilingualFilled(text: BilingualText | undefined | null): boolean {
  return Boolean(text?.en?.trim() && text?.ar?.trim());
}

export const emptyBilingual = (): BilingualText => ({ ar: '', en: '' });
