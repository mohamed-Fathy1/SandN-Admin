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
        'flex w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground',
        'transition-[border-color,box-shadow,background-color] duration-150',
        'placeholder:text-light-foreground resize-y',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
        hasError
          ? 'border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_4px_rgba(220,38,38,0.12)]'
          : 'border-border-medium hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_rgba(191,60,104,0.14)]',
        className
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
