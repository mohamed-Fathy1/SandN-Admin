import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from './breadcrumb';
import { LocaleSwitcher } from './locale-switcher';
import { Kbd } from '@/designs/shared/kbd';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { logoutAndRedirect } from '@/features/auth/lib/logout';
import { useSidebarStore } from './sidebar-store';
import { useUiStore } from './ui-store';

export function Header() {
  const { t } = useTranslation('common');
  const email = useAuthStore((s) => s.session?.email);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const openPalette = useUiStore((s) => s.togglePalette);
  const initial = (email ?? 'A').trim().charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/85 px-3 shadow-[var(--shadow-header)] backdrop-blur-md supports-[backdrop-filter]:bg-card/70 sm:h-16 sm:px-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t('header.openMenu')}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-10 lg:hidden"
        >
          <Menu size={20} strokeWidth={1.5} aria-hidden />
        </button>
        <Breadcrumb />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={openPalette}
          aria-label={t('actions.search')}
          className="group hidden h-9 items-center gap-2 rounded-full border border-border-medium bg-background/60 ps-3 pe-1.5 text-xs text-muted-foreground transition-[color,background-color,border-color] duration-150 hover:border-accent/40 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
        >
          <Search size={13} strokeWidth={1.75} aria-hidden className="text-light-foreground group-hover:text-accent" />
          <span className="pe-6 text-light-foreground">{t('search.placeholder')}</span>
          <Kbd className="ms-auto">⌘K</Kbd>
        </button>

        <button
          type="button"
          onClick={openPalette}
          aria-label={t('actions.search')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
        >
          <Search size={17} strokeWidth={1.75} aria-hidden />
        </button>

        <LocaleSwitcher />

        <button
          type="button"
          disabled
          aria-label={t('header.notifications')}
          title={t('states.comingSoon')}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell size={17} strokeWidth={1.5} aria-hidden />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="group inline-flex h-9 items-center gap-2 rounded-full border border-transparent ps-1 pe-1 transition-[background-color,border-color] duration-150 hover:border-border-medium hover:bg-card sm:pe-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('header.account')}
            >
              <span
                className="avatar-accent inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold leading-none text-white"
                aria-hidden
              >
                {initial}
              </span>
              <span className="hidden text-xs font-medium text-foreground sm:inline">
                {email ?? t('appName')}
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={10}
              className="min-w-[220px] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-popover data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            >
              {email && (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className="avatar-accent inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-none text-white"
                    aria-hidden
                  >
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="text-eyebrow text-light-foreground">{t('header.signedIn')}</p>
                    <p className="truncate text-sm text-foreground">{email}</p>
                  </div>
                </div>
              )}
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={logoutAndRedirect}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
              >
                <LogOut size={14} strokeWidth={1.5} aria-hidden />
                {t('header.logout')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
