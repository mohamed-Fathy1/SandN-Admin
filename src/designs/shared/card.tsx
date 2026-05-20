import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const cardVariants = cva('rounded-2xl bg-card border border-border', {
  variants: {
    elevation: {
      none: '',
      sm: 'shadow-card',
      md: 'shadow-popover',
      lg: 'shadow-overlay',
    },
    padding: {
      none: '',
      md: 'p-6',
      lg: 'p-10',
    },
  },
  defaultVariants: {
    elevation: 'sm',
    padding: 'md',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ elevation, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
