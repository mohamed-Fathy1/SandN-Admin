import { cn } from '@/shared/utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, tabs, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 font-display text-3xl italic leading-tight text-foreground">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {tabs && <div className="mt-6">{tabs}</div>}
    </div>
  );
}
