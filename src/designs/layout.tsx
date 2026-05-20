import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './layout/sidebar';
import { Header } from './layout/header';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
