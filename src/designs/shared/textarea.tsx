import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'flex w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground transition-all',
        'placeholder:text-light-foreground resize-y',
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
  )
);
Textarea.displayName = 'Textarea';
