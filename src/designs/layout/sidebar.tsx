import { motion } from 'framer-motion';
import { useSidebarStore } from './sidebar-store';
import { SidebarNav } from './sidebar-nav';
import { usePrefersReducedMotion } from '@/designs/shared/motion';
import { A } from './tokens';

const EXPANDED_WIDTH = 248;
const COLLAPSED_WIDTH = 72;

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const reduced = usePrefersReducedMotion();
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <motion.aside
      initial={false}
      animate={{ width }}
      transition={reduced ? { duration: 0 } : A.spring}
      className="sticky top-0 hidden h-screen flex-col overflow-hidden font-body text-sidebar-foreground lg:flex"
      aria-label="Primary navigation"
      style={{
        background:
          'linear-gradient(180deg, #22101A 0%, #1C0B12 35%, #170810 100%)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(120% 60% at 0% 0%, rgba(191,60,104,0.10), transparent 60%), radial-gradient(80% 40% at 100% 100%, rgba(191,60,104,0.06), transparent 70%)',
        }}
      />
      <div className="relative flex h-full flex-col">
        <SidebarNav
          collapsed={collapsed}
          showCollapseToggle
          onToggleCollapse={toggle}
        />
      </div>
    </motion.aside>
  );
}
