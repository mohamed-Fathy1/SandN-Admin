import { format } from 'date-fns';
import { ar as dfAr, enUS as dfEn } from 'date-fns/locale';
import i18n from '@/i18n';
import type { Locale } from '@/config/constants';

export function formatGroupName(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function activeLocale(): Locale {
  const lng = (i18n.language || 'ar').slice(0, 2);
  return lng === 'ar' ? 'ar' : 'en';
}

function intlLocale(): string {
  return activeLocale() === 'ar' ? 'ar-EG' : 'en-EG';
}

export function formatEGP(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat(intlLocale(), {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat(activeLocale() === 'ar' ? 'ar-EG' : 'en-US').format(value);
}

export function formatDate(value: string | number | Date | undefined | null): string {
  if (value == null) return '—';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy', {
    locale: activeLocale() === 'ar' ? dfAr : dfEn,
  });
}

export function formatDateTime(value: string | number | Date | undefined | null): string {
  if (value == null) return '—';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy · h:mm a', {
    locale: activeLocale() === 'ar' ? dfAr : dfEn,
  });
}
