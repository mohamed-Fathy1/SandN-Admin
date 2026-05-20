import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { cn } from '@/shared/utils/cn';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}

export interface OtpInputHandle {
  focusFirst: () => void;
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, length = 6, autoFocus = true, hasError, disabled },
  ref
) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useImperativeHandle(
    ref,
    () => ({
      focusFirst: () => inputs.current[0]?.focus(),
    }),
    []
  );

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (idx: number, digit: string) => {
    const next = value.split('');
    while (next.length < length) next.push('');
    next[idx] = digit;
    const joined = next.slice(0, length).join('');
    onChange(joined);
    if (joined.length === length && !joined.includes('') && onComplete) {
      onComplete(joined);
    }
  };

  const handleChange = (idx: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) {
      setDigit(idx, '');
      return;
    }
    setDigit(idx, digit);
    if (idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        setDigit(idx, '');
        return;
      }
      if (idx > 0) {
        inputs.current[idx - 1]?.focus();
        setDigit(idx - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    if (pasted.length === length && onComplete) onComplete(pasted);
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="One-time code">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputs.current[idx] = el;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={value[idx] ?? ''}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${idx + 1}`}
          aria-invalid={hasError || undefined}
          className={cn(
            'h-14 w-12 rounded-xl border bg-card text-center text-xl font-semibold text-foreground transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-border-medium hover:border-border-strong focus-visible:ring-ring focus-visible:border-accent'
          )}
        />
      ))}
    </div>
  );
});
