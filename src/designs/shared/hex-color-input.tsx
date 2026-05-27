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
      <div className={cn('flex items-center gap-1.5', className)}>
        <label
          htmlFor={colorId}
          className="relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border-medium bg-card shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
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
            'flex h-11 w-full rounded-xl border bg-card px-4 text-sm uppercase text-foreground',
            'transition-[border-color,box-shadow,background-color] duration-150 touch-manipulation',
            'focus-visible:outline-none',
            'placeholder:text-light-foreground placeholder:normal-case',
            'disabled:cursor-not-allowed disabled:opacity-50 font-mono',
            hasError
              ? 'border-destructive focus-visible:border-destructive focus-visible:shadow-[var(--shadow-focus-destructive)]'
              : 'border-border-medium hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[var(--shadow-focus-accent)]'
          )}
        />
      </div>
    );
  }
);
HexColorInput.displayName = 'HexColorInput';
