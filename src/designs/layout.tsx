import { useEffect, useMemo } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Sidebar } from './layout/sidebar';
import { MobileSidebar } from './layout/mobile-sidebar';
import { Header } from './layout/header';
import { CommandPalette } from './layout/command-palette';
import { ShortcutHelp } from './layout/shortcut-help';
import { useSidebarStore } from './layout/sidebar-store';
import { useUiStore } from './layout/ui-store';
import {
  useKeyboardShortcuts,
  type Shortcut,
} from '@/shared/hooks/use-keyboard-shortcuts';

export function AdminLayout() {
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const togglePalette = useUiStore((s) => s.togglePalette);
  const toggleShortcuts = useUiStore((s) => s.toggleShortcuts);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      { key: 'b', mod: true, handler: toggleSidebar },
      { key: 'k', mod: true, handler: togglePalette },
      { key: '/', shift: true, handler: toggleShortcuts },
    ],
    [toggleSidebar, togglePalette, toggleShortcuts]
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <div className="relative flex min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.6]"
        style={{
          background:
            'radial-gradient(60% 40% at 85% -5%, rgba(191,60,104,0.06), transparent 60%), radial-gradient(50% 35% at 5% 110%, rgba(191,60,104,0.04), transparent 70%)',
        }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:shadow-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to main content
      </a>
      <Sidebar />
      <MobileSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"
        >
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <ShortcutHelp />
    </div>
  );
}
