import { Children, cloneElement, isValidElement, useId } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/shared/utils/cn';

interface AdminFormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function AdminFormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: AdminFormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  let renderedChild: React.ReactNode = children;
  const child = Children.only(children);
  if (isValidElement(child)) {
    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;
    type InjectableProps = {
      id?: string;
      'aria-describedby'?: string;
      'aria-invalid'?: boolean;
      hasError?: boolean;
    };
    const childProps = child.props as InjectableProps;
    renderedChild = cloneElement(child as React.ReactElement<InjectableProps>, {
      id: childProps.id ?? fieldId,
      'aria-describedby': describedBy,
      'aria-invalid': Boolean(error) || undefined,
      hasError: Boolean(error) || childProps.hasError,
    });
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <LabelPrimitive.Root
          htmlFor={fieldId}
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </LabelPrimitive.Root>
      ) : null}
      {renderedChild}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
