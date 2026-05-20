import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { BREADCRUMB_TITLES } from './nav-config';

interface Crumb {
  to: string;
  label: string;
}

export function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <div key={crumb.to} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight
                size={14}
                strokeWidth={1.5}
                aria-hidden
                className="text-light-foreground"
              />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to as never}
                className="text-muted-foreground hover:underline"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === '/' || pathname === '') {
    return [{ to: '/', label: BREADCRUMB_TITLES['/'] ?? 'Dashboard' }];
  }
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ to: '/', label: 'Dashboard' }];
  let acc = '';
  for (const part of parts) {
    acc += `/${part}`;
    crumbs.push({ to: acc, label: BREADCRUMB_TITLES[acc] ?? toTitleCase(part) });
  }
  return crumbs;
}

function toTitleCase(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
