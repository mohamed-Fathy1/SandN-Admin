import { format, formatDistanceToNow } from 'date-fns';
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

/** Locale-aware relative time with suffix, e.g. "3 hours ago" / "منذ ٣ ساعات". */
export function formatRelativeTime(value: string | number | Date | undefined | null): string {
  if (value == null) return '—';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: activeLocale() === 'ar' ? dfAr : dfEn,
  });
}

/**
 * Formats a `YYYY-MM-DD` calendar-day string without timezone shifting.
 * Building the Date from explicit Y/M/D components keeps the same day a UTC
 * backup-sequence gap refers to, regardless of the viewer's timezone.
 */
export function formatCalendarDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return format(new Date(y, m - 1, d), 'EEE, MMM d, yyyy', {
    locale: activeLocale() === 'ar' ? dfAr : dfEn,
  });
}
