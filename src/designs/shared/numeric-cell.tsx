import { cn } from '@/shared/utils/cn';

interface NumericCellProps extends React.HTMLAttributes<HTMLSpanElement> {
  align?: 'right' | 'left';
  muted?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function NumericCell({
  align = 'right',
  muted = false,
  className,
  children,
  ...rest
}: NumericCellProps) {
  return (
    <span
      className={cn(
        'font-tabular tracking-tight',
        align === 'right' ? 'inline-block w-full text-right' : 'text-left',
        muted ? 'text-muted-foreground' : 'text-foreground',
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
