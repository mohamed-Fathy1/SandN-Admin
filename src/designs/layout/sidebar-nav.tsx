import { Link, useRouterState } from '@tanstack/react-router';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';
import { LogOut, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { NAV_GROUPS } from './nav-config';
import { logoutAndRedirect } from '@/features/auth/lib/logout';
import { cn } from '@/shared/utils/cn';

interface SidebarNavProps {
  collapsed: boolean;
  showBrand?: boolean;
  showCollapseToggle?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export function SidebarNav({
  collapsed,
  showBrand = true,
  showCollapseToggle = false,
  onToggleCollapse,
  onNavigate,
}: SidebarNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {(showBrand || showCollapseToggle) && (
        <div className="relative flex h-16 items-center px-4">
          {showBrand && !collapsed ? (
            <Link
              to="/"
              onClick={onNavigate}
              className="group inline-flex items-baseline gap-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="S and N — Dashboard"
            >
              <span className="font-display text-2xl leading-none text-sidebar-foreground-active">
                S
              </span>
              <span className="font-display text-2xl italic leading-none text-accent">
                &amp;
              </span>
              <span className="font-display text-2xl leading-none text-sidebar-foreground-active">
                N
              </span>
            </Link>
          ) : null}
          {showCollapseToggle && onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                collapsed ? 'mx-auto' : 'ml-auto'
              )}
            >
              {collapsed ? (
                <PanelLeftOpen size={15} strokeWidth={1.75} aria-hidden />
              ) : (
                <PanelLeftClose size={15} strokeWidth={1.75} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      )}

      <Tooltip.Provider delayDuration={300}>
        <nav
          className="flex-1 overflow-y-auto px-3 pb-4"
          style={{ overscrollBehavior: 'contain' }}
        >
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className={cn('mb-5', gIdx === 0 && 'mb-3')}>
              {group.label && !collapsed ? (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {group.label}
                </p>
              ) : null}
              {group.label && collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={logoutAndRedirect}
                aria-label="Log out"
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed && 'justify-center px-0'
                )}
              >
                <LogOut
                  size={17}
                  strokeWidth={1.5}
                  aria-hidden
                  className="transition-transform motion-safe:group-hover:-translate-x-0.5"
                />
                {!collapsed && <span>Log out</span>}
              </button>
            </Tooltip.Trigger>
            {collapsed && (
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={10}
                  className="rounded-md border border-white/10 bg-sidebar px-2.5 py-1.5 text-xs text-white shadow-overlay"
                >
                  Log out
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>
      </Tooltip.Provider>
    </>
  );
}

interface SidebarLinkProps {
  item: { label: string; to: string; icon: LucideIcon };
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}

function SidebarLink({ item, collapsed, pathname, onNavigate }: SidebarLinkProps) {
  const Icon = item.icon;
  const isActive =
    item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`);

  return (
    <li>
      <Tooltip.Root key={pathname}>
        <Tooltip.Trigger asChild>
          <Link
            to={item.to as never}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
              'transition-[color,background-color] duration-150 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'text-sidebar-foreground-active'
                : 'text-sidebar-foreground hover:bg-white/[0.05] hover:text-white',
              collapsed && 'justify-center px-0'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active-pill"
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-lg bg-accent/15 ring-1 ring-inset ring-accent/25"
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              />
            )}
            <Icon
              size={17}
              strokeWidth={isActive ? 2 : 1.5}
              aria-hidden
              className={cn(
                'relative shrink-0 transition-transform duration-[280ms]',
                '[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]',
                !isActive && 'motion-safe:group-hover:scale-110'
              )}
            />
            {!collapsed && (
              <span className={cn('relative truncate', isActive && 'font-semibold')}>
                {item.label}
              </span>
            )}
          </Link>
        </Tooltip.Trigger>
        {collapsed && (
          <Tooltip.Portal>
            <Tooltip.Content
              side="right"
              sideOffset={10}
              className="rounded-md border border-white/10 bg-sidebar px-2.5 py-1.5 text-xs text-white shadow-overlay"
            >
              {item.label}
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </li>
  );
}
