import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useSidebarStore } from './sidebar-store';
import { SidebarNav } from './sidebar-nav';

export function MobileSidebar() {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  return (
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden"
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 flex w-[min(288px,85vw)] flex-col overflow-hidden font-body text-sidebar-foreground shadow-overlay focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden"
          aria-label="Mobile navigation"
          style={{
            background:
              'linear-gradient(180deg, #22101A 0%, #1C0B12 35%, #170810 100%)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60 [background:var(--gradient-mobile-sidebar-bg)]"
          />
          <div className="relative flex h-full flex-col">
            <div className="flex h-16 items-center justify-between px-4">
              <Dialog.Title asChild>
                <span className="m-0 inline-flex items-baseline gap-0.5">
                  <span className="font-display text-2xl leading-none text-sidebar-foreground-active">S</span>
                  <span className="font-display text-2xl italic leading-none text-accent">&amp;</span>
                  <span className="font-display text-2xl leading-none text-sidebar-foreground-active">N</span>
                </span>
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={18} strokeWidth={1.5} aria-hidden />
              </Dialog.Close>
            </div>
            <SidebarNav collapsed={false} showBrand={false} onNavigate={closeMobile} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
