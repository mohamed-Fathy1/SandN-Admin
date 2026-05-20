import { cn } from '@/shared/utils/cn';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/**
 * Renders a keyboard chord like ⌘K or Esc.
 */
export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-border-medium bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
