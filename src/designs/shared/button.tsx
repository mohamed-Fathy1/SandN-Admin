import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const buttonVariants = cva(
  [
    'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold',
    'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 disabled:hover:translate-y-0',
    'aria-busy:cursor-progress',
    'active:translate-y-px motion-safe:active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-foreground shadow-accent hover:bg-accent-hover hover:shadow-[var(--shadow-accent-hover)] motion-safe:hover:-translate-y-px focus-visible:shadow-[var(--shadow-glow)] disabled:bg-accent/40 disabled:hover:bg-accent/40 disabled:hover:shadow-accent',
        secondary:
          'bg-card text-foreground border border-border-medium hover:border-border-strong hover:bg-muted disabled:bg-muted/60 disabled:text-muted-foreground disabled:border-border disabled:hover:bg-muted/60 disabled:hover:border-border',
        ghost:
          'bg-transparent text-foreground hover:bg-muted disabled:text-muted-foreground disabled:hover:bg-transparent',
        outline:
          'bg-transparent text-foreground border border-border-strong hover:border-accent hover:text-accent hover:bg-accent-soft disabled:text-muted-foreground disabled:border-border disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:hover:border-border',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[var(--shadow-destructive-rest)] hover:bg-destructive-hover motion-safe:hover:-translate-y-px disabled:bg-destructive/40 disabled:hover:bg-destructive/40',
        link:
          'bg-transparent text-accent hover:text-accent-hover underline-offset-4 hover:underline rounded-none disabled:text-muted-foreground disabled:hover:no-underline',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading, loadingText, disabled, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">Loading…</span>
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
