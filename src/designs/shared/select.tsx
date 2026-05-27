import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T | undefined;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const triggerClasses = (hasError?: boolean) =>
  cn(
    'inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-card px-4 text-sm text-foreground',
    'transition-[border-color,box-shadow,background-color] duration-150',
    'focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[placeholder]:text-light-foreground',
    hasError
      ? 'border-destructive focus-visible:border-destructive focus-visible:shadow-[var(--shadow-focus-destructive)]'
      : 'border-border-medium hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[var(--shadow-focus-accent)]'
  );

function SelectComponent<T extends string>(
  {
    value,
    onValueChange,
    options,
    placeholder,
    disabled,
    hasError,
    className,
    id,
    ...aria
  }: SelectProps<T>,
  ref: React.Ref<HTMLButtonElement>
) {
  return (
    <SelectPrimitive.Root
      value={value ?? undefined}
      onValueChange={(v) => onValueChange(v as T)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        className={cn(triggerClasses(hasError), className)}
        {...aria}
      >
        <SelectPrimitive.Value placeholder={placeholder ?? 'Select…'} />
        <SelectPrimitive.Icon>
          <ChevronDown size={16} strokeWidth={1.5} aria-hidden className="text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-popover"
        >
          <SelectPrimitive.Viewport>
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={14} strokeWidth={2} className="text-accent" aria-hidden />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export const Select = forwardRef(SelectComponent) as <T extends string>(
  props: SelectProps<T> & { ref?: React.Ref<HTMLButtonElement> }
) => React.ReactElement;
