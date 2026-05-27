import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const cardVariants = cva(
  'relative rounded-2xl bg-card border border-border transition-[box-shadow,transform,border-color] duration-200',
  {
    variants: {
      elevation: {
        none: '',
        sm: 'shadow-card',
        md: 'shadow-popover',
        lg: 'shadow-overlay',
      },
      padding: {
        none: '',
        md: 'p-4 sm:p-6',
        lg: 'p-6 sm:p-10',
      },
      interactive: {
        true: 'motion-safe:hover:-translate-y-0.5 hover:border-border-medium hover:shadow-popover',
        false: '',
      },
    },
    defaultVariants: {
      elevation: 'sm',
      padding: 'md',
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ elevation, padding, interactive }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
