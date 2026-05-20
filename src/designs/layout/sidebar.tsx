import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { LogOut, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { useSidebarStore } from './sidebar-store';
import { NAV_GROUPS } from './nav-config';
import { A } from './tokens';
import { logoutAndRedirect } from '@/features/auth/lib/logout';
import { cn } from '@/shared/utils/cn';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={A.spring}
      className="sticky top-0 flex h-screen flex-col bg-sidebar font-body text-sidebar-foreground"
      aria-label="Primary navigation"
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <span className="font-display text-lg italic tracking-wide text-sidebar-foreground-active">
            S&amp;N
          </span>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>

      <Tooltip.Provider delayDuration={300}>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="mb-4">
              {group.label && !collapsed ? (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink key={item.to} item={item} collapsed={collapsed} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 p-2">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={logoutAndRedirect}
                aria-label="Log out"
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed && 'justify-center px-0'
                )}
              >
                <LogOut size={18} strokeWidth={1.5} aria-hidden />
                {!collapsed && <span>Log out</span>}
              </button>
            </Tooltip.Trigger>
            {collapsed && (
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  className="rounded-md bg-black px-2 py-1 text-xs text-white"
                >
                  Log out
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>
      </Tooltip.Provider>
    </motion.aside>
  );
}

interface SidebarLinkProps {
  item: { label: string; to: string; icon: LucideIcon };
  collapsed: boolean;
}

function SidebarLink({ item, collapsed }: SidebarLinkProps) {
  const Icon = item.icon;
  const baseClasses = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-sidebar-foreground',
    'hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    collapsed && 'justify-center px-0'
  );

  return (
    <li>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {/* Cast `to` because Phase 2 nav config references routes that will be registered in later phases. */}
          <Link
            to={item.to as never}
            className={baseClasses}
            activeProps={{ className: 'bg-sidebar-active !text-sidebar-foreground-active' }}
            activeOptions={{ exact: item.to === '/' }}
          >
            <Icon size={18} strokeWidth={1.5} aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        </Tooltip.Trigger>
        {collapsed && (
          <Tooltip.Portal>
            <Tooltip.Content
              side="right"
              sideOffset={8}
              className="rounded-md bg-black px-2 py-1 text-xs text-white"
            >
              {item.label}
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </li>
  );
}
