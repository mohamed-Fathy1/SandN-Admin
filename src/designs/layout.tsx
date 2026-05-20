import { useMemo } from 'react';
import { Outlet } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Sidebar } from './layout/sidebar';
import { Header } from './layout/header';
import { useSidebarStore } from './layout/sidebar-store';
import {
  useKeyboardShortcuts,
  type Shortcut,
} from '@/shared/hooks/use-keyboard-shortcuts';

export function AdminLayout() {
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        key: 'b',
        mod: true,
        handler: toggleSidebar,
      },
      {
        key: 'k',
        mod: true,
        handler: () => toast('Command palette is coming soon.', { duration: 1500 }),
      },
    ],
    [toggleSidebar]
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:shadow-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
