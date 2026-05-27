import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'
>;

export interface NumberInputProps extends NativeInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  suffix?: string;
  clampMin?: number;
  clampMax?: number;
  allowDecimal?: boolean;
  hasError?: boolean;
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min != null && next < min) next = min;
  if (max != null && next > max) next = max;
  return next;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      suffix,
      clampMin,
      clampMax,
      allowDecimal = false,
      hasError,
      className,
      disabled,
      onBlur,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '' || raw === '-') {
        onChange('');
        return;
      }
      const allowed = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
      if (!allowed.test(raw)) return;
      const num = allowDecimal ? parseFloat(raw) : parseInt(raw, 10);
      if (Number.isNaN(num)) {
        onChange('');
        return;
      }
      onChange(num);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (typeof value === 'number') {
        const clamped = clamp(value, clampMin, clampMax);
        if (clamped !== value) onChange(clamped);
      }
      onBlur?.(e);
    };

    return (
      <div className={cn('relative', className)}>
        <input
          ref={ref}
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          value={value === '' ? '' : String(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-card px-4 text-sm text-foreground',
            'transition-[border-color,box-shadow,background-color] duration-150',
            'placeholder:text-light-foreground text-right tabular-nums touch-manipulation',
            'focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            suffix && 'pr-11',
            hasError
              ? 'border-destructive focus-visible:border-destructive focus-visible:shadow-[var(--shadow-focus-destructive)]'
              : 'border-border-medium hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[var(--shadow-focus-accent)]'
          )}
          {...props}
        />
        {suffix ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium uppercase tracking-wide text-light-foreground"
          >
            {suffix}
          </span>
        ) : null}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';
