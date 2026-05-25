import { forwardRef } from 'react';
import { format, parse } from 'date-fns';
import { cn } from '@/shared/utils/cn';

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Value as Unix milliseconds. `0` = no date (renders as empty). */
  value: number;
  onChange: (msSinceEpoch: number) => void;
  hasError?: boolean;
}

const DATE_FORMAT = 'yyyy-MM-dd';

function msToYmd(ms: number): string {
  if (!ms) return '';
  return format(new Date(ms), DATE_FORMAT);
}

function ymdToMs(ymd: string): number {
  if (!ymd) return 0;
  const parsed = parse(ymd, DATE_FORMAT, new Date(0));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, hasError, className, disabled, ...props }, ref) => (
    <input
      ref={ref}
      type="date"
      value={msToYmd(value)}
      onChange={(e) => onChange(ymdToMs(e.target.value))}
      disabled={disabled}
      aria-invalid={hasError || undefined}
      className={cn(
        'flex h-11 w-full rounded-xl border bg-card px-4 text-sm text-foreground',
        'transition-[border-color,box-shadow,background-color] duration-150 touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        hasError
          ? 'border-destructive focus-visible:ring-destructive'
          : 'border-border-medium hover:border-border-strong focus-visible:ring-ring focus-visible:border-accent',
        className
      )}
      {...props}
    />
  )
);
DateInput.displayName = 'DateInput';
