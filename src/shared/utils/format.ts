import { format } from 'date-fns';

export function formatGroupName(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

const egpFormatter = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
});

export function formatEGP(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return egpFormatter.format(amount);
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(value: string | number | Date | undefined | null): string {
  if (value == null) return '—';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy');
}

export function formatDateTime(value: string | number | Date | undefined | null): string {
  if (value == null) return '—';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy · h:mm a');
}
