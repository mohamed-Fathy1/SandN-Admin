import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-card px-4 text-sm text-foreground transition-all',
          'placeholder:text-light-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-destructive focus-visible:ring-destructive'
            : 'border-border-medium hover:border-border-strong focus-visible:ring-ring focus-visible:border-accent',
          className
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
