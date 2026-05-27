import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { A } from '@/designs/layout/tokens';
import { useSidebarStore } from '@/designs/layout/sidebar-store';
import { usePrefersReducedMotion } from './motion';

export type StickyActionStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface StickyActionBarProps {
  /** When false, the bar is unmounted (no entry animation, no DOM cost). */
  open: boolean;
  status?: StickyActionStatus;
  /** Status copy override. Default copy maps from `status`. */
  statusLabel?: React.ReactNode;
  /** Right-aligned primary action (Save). */
  primary?: React.ReactNode;
  /** Right-aligned secondary action (Discard / Cancel). */
  secondary?: React.ReactNode;
  /** Left-aligned destructive action (Delete N). */
  destructive?: React.ReactNode;
  className?: string;
}

const STATUS_COPY: Record<StickyActionStatus, string> = {
  idle: 'All changes saved',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Could not save',
};

/**
 * Slides up from the bottom of the viewport on long edit surfaces. Sits above
 * the page content with a glass surface so admins never have to scroll back to
 * commit. Mounts at the page level so it tracks the main content column rather
 * than the sidebar.
 */
export function StickyActionBar({
  open,
  status = 'idle',
  statusLabel,
  primary,
  secondary,
  destructive,
  className,
}: StickyActionBarProps) {
  const reduced = usePrefersReducedMotion();
  const sidebarCollapsed = useSidebarStore((s) => s.collapsed);
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="sticky-action-bar"
          role="region"
          aria-label="Pending changes"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
          transition={reduced ? { duration: 0 } : A.springSnappy}
          className={cn(
            'pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:px-6 sm:pb-5 lg:pr-10',
            // Sidebar offset (72px collapsed / 248px expanded) + 40px gutter.
            sidebarCollapsed ? 'lg:pl-[112px]' : 'lg:pl-[288px]',
            className
          )}
        >
          <div
            className="pointer-events-auto mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-medium px-4 py-3 sm:px-5 sm:py-3.5"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              boxShadow: 'var(--shadow-overlay), var(--shadow-inset)',
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <StatusDot status={status} />
              <div className="flex flex-col leading-tight">
                <span className="text-eyebrow text-light-foreground">Status</span>
                <span
                  className="text-sm font-medium text-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {statusLabel ?? STATUS_COPY[status]}
                </span>
              </div>
              {destructive ? <div className="ml-2 flex items-center gap-2">{destructive}</div> : null}
            </div>
            <div className="flex items-center gap-2">
              {secondary}
              {primary}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StatusDot({ status }: { status: StickyActionStatus }) {
  if (status === 'saving') {
    return (
      <span
        aria-hidden
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent"
      >
        <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span
        aria-hidden
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-status-delivered-bg text-status-delivered"
      >
        <CheckCircle2 size={16} strokeWidth={1.75} />
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span
        aria-hidden
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-status-cancelled-bg text-destructive"
      >
        !
      </span>
    );
  }
  if (status === 'dirty') {
    return (
      <span
        aria-hidden
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft"
      >
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="absolute inset-1 rounded-full bg-accent/20 motion-safe:animate-ping" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
    >
      <span className="h-2 w-2 rounded-full bg-light-foreground" />
    </span>
  );
}
