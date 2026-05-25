import { Link, useRouterState } from '@tanstack/react-router';
import { BREADCRUMB_TITLES } from './nav-config';
import { useUiStore } from './ui-store';

interface Crumb {
  to: string;
  label: string;
}

const DYNAMIC_SEGMENT = /^(?:[0-9a-f]{8,}|\d+)$/i;

export function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const override = useUiStore((s) => s.crumbOverrides[pathname]);
  const crumbs = buildCrumbs(pathname);
  if (override && crumbs.length > 0) {
    crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], label: override };
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <div key={crumb.to} className="flex min-w-0 items-center gap-2">
            {idx > 0 && (
              <span aria-hidden className="select-none text-light-foreground">
                /
              </span>
            )}
            {isLast ? (
              <span
                aria-current="page"
                className="truncate font-display text-base italic text-foreground"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to as never}
                className="shrink-0 text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-accent"
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
  let lastStaticLabel = 'Dashboard';
  for (const part of parts) {
    acc += `/${part}`;
    const known = BREADCRUMB_TITLES[acc];
    if (known) {
      crumbs.push({ to: acc, label: known });
      lastStaticLabel = known;
    } else if (DYNAMIC_SEGMENT.test(part)) {
      // Unreadable id segment — borrow the parent's label and tag it as a detail.
      crumbs.push({ to: acc, label: `${lastStaticLabel} detail` });
    } else {
      const label = toTitleCase(part);
      crumbs.push({ to: acc, label });
      lastStaticLabel = label;
    }
  }
  return crumbs;
}

function toTitleCase(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
