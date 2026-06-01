import { forwardRef } from 'react';
import { format, parse } from 'date-fns';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/cn';

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Value as Unix milliseconds. `0` = no date (renders as empty). */
  value: number;
  onChange: (msSinceEpoch: number) => void;
  hasError?: boolean;
  /**
   * Localized explanation shown as a toast when the user taps a disabled
   * field. A native disabled `<input>` swallows pointer events silently,
   * leaving the user with no signal — this surfaces the reason.
   */
  disabledReason?: string;
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
  ({ value, onChange, hasError, className, disabled, disabledReason, ...props }, ref) => {
    const ymd = msToYmd(value);
    const isEmpty = !ymd;
    return (
      <label
        className={cn(
          'relative flex h-11 w-full items-center rounded-xl border bg-card ps-4 pe-10 text-sm',
          'transition-[border-color,box-shadow,background-color] duration-150',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-1',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-text',
          hasError
            ? 'border-destructive focus-within:ring-destructive'
            : 'border-border-medium hover:border-border-strong focus-within:ring-ring focus-within:border-accent',
          className
        )}
      >
        <span
          className={cn(
            'truncate',
            isEmpty ? 'text-light-foreground' : 'text-foreground'
          )}
        >
          {isEmpty ? 'yyyy-mm-dd' : ymd}
        </span>
        <Calendar
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        {/* Native input sits on top of the visible UI so every tap on the
            field reaches the input directly. Keeping the real
            <input type="date"> preserves iOS Safari's native picker — no
            `appearance: none`, no pseudo-element repositioning.
            When disabled the input swallows the tap, but the surrounding
            <label>'s onClick still fires — that's what surfaces the
            disabledReason toast. */}
        <input
          ref={ref}
          type="date"
          value={ymd}
          onChange={(e) => onChange(ymdToMs(e.target.value))}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className="absolute inset-0 z-10 h-full w-full cursor-[inherit] opacity-0"
          {...props}
        />
        {disabled && disabledReason && (
          <button
            type="button"
            aria-label={disabledReason}
            onClick={() =>
              toast.info(disabledReason, { id: `date-input-disabled-${disabledReason}` })
            }
            className="absolute inset-0 z-20 cursor-pointer rounded-xl"
          />
        )}
      </label>
    );
  }
);
DateInput.displayName = 'DateInput';
