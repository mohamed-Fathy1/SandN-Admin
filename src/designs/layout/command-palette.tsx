import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, CornerDownLeft, Search, type LucideIcon } from 'lucide-react';
import { useUiStore } from './ui-store';
import { NAV_GROUPS } from './nav-config';
import { Kbd } from '@/designs/shared/kbd';
import { cn } from '@/shared/utils/cn';

interface PaletteItem {
  label: string;
  to: string;
  icon: LucideIcon;
  group?: string;
  haystack: string;
}

const ALL_ITEMS: PaletteItem[] = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    label: item.label,
    to: item.to,
    icon: item.icon,
    group: group.label,
    haystack: `${item.label} ${group.label ?? ''} ${item.to}`.toLowerCase(),
  }))
);

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const navigate = useNavigate();
  // Re-mount on open so query + activeIndex reset without an effect.
  return open ? <PaletteContent navigate={navigate} setOpen={setOpen} /> : null;
}

function PaletteContent({
  navigate,
  setOpen,
}: {
  navigate: ReturnType<typeof useNavigate>;
  setOpen: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [keyIndex, setKeyIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ITEMS;
    return ALL_ITEMS.filter((i) => i.haystack.includes(q));
  }, [query]);

  // Active index = keyboard cursor, clamped to current result range.
  const activeIndex = Math.min(
    hoverIndex ?? keyIndex,
    Math.max(results.length - 1, 0)
  );

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const onSelect = (to: string) => {
    setOpen(false);
    queueMicrotask(() => navigate({ to: to as never }));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHoverIndex(null);
      setKeyIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHoverIndex(null);
      setKeyIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) onSelect(item.to);
    }
  };

  const onQueryChange = (next: string) => {
    setQuery(next);
    setHoverIndex(null);
    setKeyIndex(0);
  };

  return (
    <Dialog.Root open onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          aria-label="Command palette"
          className="fixed left-1/2 top-[18%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-overlay focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search and jump to any page.
          </Dialog.Description>
          <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
            <Search size={15} strokeWidth={1.75} aria-hidden className="text-light-foreground" />
            <input
              autoFocus
              type="text"
              name="palette-search"
              autoComplete="off"
              spellCheck={false}
              inputMode="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a page name…"
              className="w-full bg-transparent text-base text-foreground placeholder:text-light-foreground focus-visible:outline-none"
              aria-label="Search pages"
              aria-controls="palette-list"
              aria-activedescendant={
                results[activeIndex] ? `palette-item-${activeIndex}` : undefined
              }
            />
            <Kbd className="ml-auto hidden sm:inline-flex">esc</Kbd>
          </div>

          <ul
            ref={listRef}
            id="palette-list"
            role="listbox"
            className="max-h-[60vh] overflow-y-auto p-2"
            style={{ overscrollBehavior: 'contain' }}
          >
            {results.length === 0 ? (
              <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                No matches for{' '}
                <span className="font-medium text-foreground">“{query}”</span>
              </li>
            ) : (
              results.map((item, idx) => {
                const Icon = item.icon;
                const active = idx === activeIndex;
                return (
                  <li
                    key={item.to}
                    id={`palette-item-${idx}`}
                    data-idx={idx}
                    role="option"
                    aria-selected={active}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(item.to)}
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(null)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'bg-accent-soft text-foreground'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                          active
                            ? 'border-accent/40 bg-card text-accent'
                            : 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon size={15} strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{item.label}</span>
                        {item.group ? (
                          <span className="truncate text-eyebrow text-light-foreground">
                            {item.group}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <CornerDownLeft
                          size={13}
                          strokeWidth={1.75}
                          aria-hidden
                          className="text-accent"
                        />
                      ) : (
                        <ArrowRight
                          size={13}
                          strokeWidth={1.5}
                          aria-hidden
                          className="text-light-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="hidden items-center justify-between gap-4 border-t border-border bg-muted/40 px-5 py-2.5 text-eyebrow text-light-foreground sm:flex">
            <span className="flex items-center gap-2">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navigate
            </span>
            <span className="flex items-center gap-2">
              <Kbd>↵</Kbd> open
            </span>
            <span className="flex items-center gap-2">
              <Kbd>esc</Kbd> close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
