import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { cn } from '@/shared/utils/cn';
import { useUiStore } from './ui-store';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tabs?: React.ReactNode;
  eyebrow?: string;
  className?: string;
  /**
   * Override the trailing breadcrumb label for the current pathname.
   * Useful for resource-detail pages: pass the product/order name so the
   * crumb reads "Products / Edit: Floral Bralette" instead of a UUID.
   */
  breadcrumbLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  tabs,
  eyebrow,
  className,
  breadcrumbLabel,
}: PageHeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setCrumbOverride = useUiStore((s) => s.setCrumbOverride);
  useEffect(() => {
    if (!breadcrumbLabel) return;
    setCrumbOverride(pathname, breadcrumbLabel);
    return () => setCrumbOverride(pathname, null);
  }, [pathname, breadcrumbLabel, setCrumbOverride]);

  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 inline-flex items-center gap-2.5 text-eyebrow text-accent">
              <span
                aria-hidden
                className="inline-block h-px w-8 bg-gradient-to-r from-transparent via-accent/70 to-accent"
              />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="m-0 font-display text-2xl italic leading-[1.1] tracking-tight text-foreground text-balance sm:text-3xl lg:text-[2.25rem] lg:leading-[1.05]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground text-pretty">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {tabs && <div className="mt-4 sm:mt-6">{tabs}</div>}
    </div>
  );
}
