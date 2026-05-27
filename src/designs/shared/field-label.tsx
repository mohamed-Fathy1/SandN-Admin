import { cn } from '@/shared/utils/cn';

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  tone?: 'default' | 'muted';
  className?: string;
  children: React.ReactNode;
}

export function FieldLabel({
  required,
  tone = 'muted',
  className,
  children,
  ...rest
}: FieldLabelProps) {
  return (
    <label
      className={cn(
        'text-eyebrow',
        tone === 'muted' ? 'text-muted-foreground' : 'text-foreground',
        className
      )}
      {...rest}
    >
      {children}
      {required ? (
        <span className="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
