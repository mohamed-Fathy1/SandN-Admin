import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  /** Optional leading icon (16-18px lucide). Adds left padding for visual alignment. */
  leadingIcon?: React.ReactNode;
  /** Optional trailing slot (clear button, status badge). Adds right padding. */
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, leadingIcon, trailing, ...props }, ref) => {
    const inputNode = (
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-card px-4 text-sm text-foreground shadow-[0_1px_0_rgba(64,20,35,0.02)_inset]',
          'transition-[border-color,box-shadow,background-color] duration-150',
          'placeholder:text-light-foreground',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
          'touch-manipulation',
          leadingIcon && 'pl-10',
          trailing && 'pr-10',
          hasError
            ? 'border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_4px_rgba(220,38,38,0.12)]'
            : 'border-border-medium hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_rgba(191,60,104,0.14)]',
          className
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );

    if (!leadingIcon && !trailing) return inputNode;

    return (
      <div className="relative">
        {leadingIcon ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-light-foreground"
          >
            {leadingIcon}
          </span>
        ) : null}
        {inputNode}
        {trailing ? (
          <span className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center">
            {trailing}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
