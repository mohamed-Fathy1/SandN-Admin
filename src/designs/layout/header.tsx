import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { Bell, Command, LogOut, User } from 'lucide-react';
import { Breadcrumb } from './breadcrumb';
import { Kbd } from '@/designs/shared/kbd';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { logoutAndRedirect } from '@/features/auth/lib/logout';

const COMMAND_PALETTE_PLACEHOLDER = 'Command palette is coming soon.';

export function Header() {
  const email = useAuthStore((s) => s.session?.email);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-card">
      <Breadcrumb />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toast(COMMAND_PALETTE_PLACEHOLDER, { duration: 1500 })}
          aria-label="Open command palette"
          title="Command palette (coming soon)"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Command size={14} strokeWidth={1.5} aria-hidden />
          <Kbd>⌘K</Kbd>
        </button>

        <button
          type="button"
          disabled
          aria-label="Notifications (coming soon)"
          title="Coming soon"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell size={18} strokeWidth={1.5} aria-hidden />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-full pl-1 pr-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                <User size={14} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="hidden text-xs text-foreground sm:inline">
                {email ?? 'Admin'}
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="min-w-[200px] rounded-xl border border-border bg-card p-1.5 shadow-popover"
            >
              {email && (
                <div className="px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-light-foreground">
                    Signed in as
                  </p>
                  <p className="text-sm text-foreground">{email}</p>
                </div>
              )}
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={logoutAndRedirect}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-muted"
              >
                <LogOut size={14} strokeWidth={1.5} aria-hidden />
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
