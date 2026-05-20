import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type CheckboxPrimitiveProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

interface CheckboxProps extends Omit<CheckboxPrimitiveProps, 'checked'> {
  checked?: boolean;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, indeterminate, ...props }, ref) => {
    const radixChecked: CheckboxPrimitiveProps['checked'] = indeterminate ? 'indeterminate' : Boolean(checked);
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={radixChecked}
        className={cn(
          'peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-card transition-colors',
          'border-border-strong hover:border-accent',
          'data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground',
          'data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent data-[state=indeterminate]:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          {indeterminate ? (
            <Minus size={10} strokeWidth={3} aria-hidden />
          ) : (
            <Check size={10} strokeWidth={3} aria-hidden />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);
Checkbox.displayName = 'Checkbox';
