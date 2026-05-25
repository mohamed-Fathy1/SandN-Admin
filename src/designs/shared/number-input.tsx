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
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            suffix && 'pr-14',
            hasError
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-border-medium hover:border-border-strong focus-visible:ring-ring focus-visible:border-accent'
          )}
          {...props}
        />
        {suffix ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
          >
            {suffix}
          </span>
        ) : null}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';
