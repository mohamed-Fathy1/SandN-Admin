import { forwardRef, useId } from 'react';
import { cn } from '@/shared/utils/cn';

export interface HexColorInputProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
}

const HEX_PATTERN = /^#[0-9a-fA-F]{0,6}$/;

export const HexColorInput = forwardRef<HTMLInputElement, HexColorInputProps>(
  ({ value, onChange, className, hasError, disabled }, ref) => {
    const colorId = useId();

    const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw === '') {
        onChange('');
        return;
      }
      const normalized = raw.startsWith('#') ? raw : `#${raw}`;
      if (HEX_PATTERN.test(normalized.toUpperCase())) {
        onChange(normalized.toUpperCase());
      }
    };

    const handleSwatch = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value.toUpperCase());
    };

    const isValid = /^#[0-9A-F]{6}$/.test(value);

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <label
          htmlFor={colorId}
          className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border-medium bg-card"
          style={{ background: isValid ? value : undefined }}
          aria-label="Color picker"
        >
          <input
            id={colorId}
            type="color"
            value={isValid ? value : '#000000'}
            onChange={handleSwatch}
            disabled={disabled}
            className="h-12 w-12 -translate-y-px cursor-pointer opacity-0"
          />
        </label>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleText}
          placeholder="#BF3C68"
          maxLength={7}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-card px-4 text-sm uppercase text-foreground transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            'placeholder:text-light-foreground placeholder:normal-case',
            'disabled:cursor-not-allowed disabled:opacity-50 font-mono',
            hasError
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-border-medium hover:border-border-strong focus-visible:ring-ring focus-visible:border-accent'
          )}
        />
      </div>
    );
  }
);
HexColorInput.displayName = 'HexColorInput';
