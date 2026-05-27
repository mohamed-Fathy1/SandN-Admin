import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Input } from './input';
import { Button } from './button';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { cn } from '@/shared/utils/cn';

interface TableToolbarProps {
  /** Live search value; controlled by the caller. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional debounce — emits onSearchCommit at the end of the wait. */
  searchDebounceMs?: number;
  onSearchCommit?: (value: string) => void;
  /** Filter controls (Select/SearchableSelect). Collapsed into a Sheet on small screens. */
  filters?: ReactNode;
  /** Right-aligned actions (export, create, etc.). */
  actions?: ReactNode;
  /** Trailing meta line, e.g. "128 products". */
  meta?: ReactNode;
  className?: string;
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchDebounceMs,
  onSearchCommit,
  filters,
  actions,
  meta,
  className,
}: TableToolbarProps) {
  const controlled = search !== undefined;
  const [uncontrolled, setUncontrolled] = useState('');
  const value = controlled ? (search as string) : uncontrolled;
  const debounced = useDebouncedValue(value, searchDebounceMs ?? 0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const lastCommittedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!onSearchCommit) return;
    if (lastCommittedRef.current === debounced) return;
    lastCommittedRef.current = debounced;
    onSearchCommit(debounced);
  }, [debounced, onSearchCommit]);

  const writeValue = (next: string) => {
    if (!controlled) setUncontrolled(next);
    onSearchChange?.(next);
  };

  const showSearch = onSearchChange || onSearchCommit;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-3 shadow-card sm:p-4',
        className
      )}
    >
      {/* Row 1 — search + meta + actions. Filters get their own row below so
          they wrap cleanly without squashing the search field. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {showSearch ? (
            <div className="flex-1 sm:max-w-md">
              <Input
                type="search"
                inputMode="search"
                spellCheck={false}
                aria-label={searchPlaceholder.replace(/…$/, '')}
                placeholder={searchPlaceholder}
                value={value}
                onChange={(e) => writeValue(e.target.value)}
                className="h-10"
                leadingIcon={<Search size={15} strokeWidth={1.75} aria-hidden />}
                trailing={
                  value ? (
                    <button
                      type="button"
                      onClick={() => writeValue('')}
                      aria-label="Clear search"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-light-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X size={13} strokeWidth={1.75} aria-hidden />
                    </button>
                  ) : null
                }
              />
            </div>
          ) : null}
          {filters ? (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border-medium bg-card px-3.5 text-xs font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal size={13} strokeWidth={1.75} aria-hidden />
              Filters
            </button>
          ) : null}
        </div>

        {actions || meta ? (
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {meta ? (
              <span className="text-eyebrow text-light-foreground">{meta}</span>
            ) : null}
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}
      </div>

      {/* Row 2 — filters. Hidden on mobile (use the sheet instead). */}
      {filters ? (
        <div className="mt-3 hidden flex-wrap items-center gap-2 border-t border-border/60 pt-3 sm:flex">
          {filters}
        </div>
      ) : null}

      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
            style={{ WebkitBackdropFilter: 'blur(4px)' }}
          />
          <Dialog.Content
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-popover focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom sm:hidden"
            style={{
              overscrollBehavior: 'contain',
              touchAction: 'manipulation',
              paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
            }}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border-medium" aria-hidden />
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Filters
            </Dialog.Title>
            <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
              Refine the list below.
            </Dialog.Description>
            <div className="mt-5 grid gap-3">{filters}</div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => setFiltersOpen(false)} size="sm">
                Done
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Pill-shaped filter chip with active/inactive states. Used for tab-style
 * filters above tables (e.g. category filters on the products list).
 */
export function FilterChip({
  active = false,
  count,
  className,
  children,
  type = 'button',
  ...rest
}: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-accent bg-accent text-accent-foreground shadow-[var(--shadow-accent)]'
          : 'border-border-medium bg-card text-muted-foreground hover:border-accent/40 hover:bg-muted hover:text-foreground',
        className
      )}
      {...rest}
    >
      {children}
      {typeof count === 'number' ? (
        <span
          className={cn(
            'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold font-tabular',
            active ? 'bg-accent-foreground/20 text-accent-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
