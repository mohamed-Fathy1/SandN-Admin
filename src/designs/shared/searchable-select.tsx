import { useEffect, useId, useMemo, useRef, useState } from 'react';
// `highlight` is clamped lazily on read (see `safeHighlight`) — no clamping effect needed.
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/cn';

interface SearchableSelectProps<T> {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  getSearchText?: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  hasError?: boolean;
  clearable?: boolean;
  id?: string;
  className?: string;
  /**
   * Localized explanation shown as a toast when the user taps a disabled
   * trigger. A native disabled `<button>` swallows pointer events silently,
   * leaving the user with no signal — this surfaces the reason.
   */
  disabledReason?: string;
}

export function SearchableSelect<T>({
  value,
  onChange,
  items,
  getKey,
  getLabel,
  getSearchText,
  renderItem,
  placeholder = 'Select…',
  emptyMessage = 'No matches',
  disabled,
  hasError,
  clearable = true,
  id,
  className,
  disabledReason,
}: SearchableSelectProps<T>) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(
    () => items.find((it) => getKey(it) === value),
    [items, getKey, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const text = (getSearchText ?? getLabel)(it).toLowerCase();
      return text.includes(q);
    });
  }, [items, query, getLabel, getSearchText]);

  // Clamp the highlight at read-time rather than mutating state in an effect.
  const safeHighlight = Math.min(highlight, Math.max(0, filtered.length - 1));

  // Scroll highlighted item into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${safeHighlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [safeHighlight, open]);

  const handleSelect = (item: T) => {
    const key = getKey(item);
    onChange(key === value && clearable ? undefined : key);
    setOpen(false);
    setQuery('');
    setHighlight(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(Math.min(safeHighlight + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(Math.max(safeHighlight - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[safeHighlight];
      if (item) handleSelect(item);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHighlight(filtered.length - 1);
    }
  };

  const activeItem = filtered[safeHighlight];
  const activeId = activeItem ? `${listboxId}-${getKey(activeItem)}` : undefined;

  // When `disabled` + `disabledReason` are both set we keep the trigger
  // natively *enabled* so it still receives taps — then block the popover
  // from opening and surface the reason as a toast instead. A natively
  // disabled <button> swallows the tap silently, leaving the user with no
  // signal about why the field is inert.
  const hasDisabledHint = Boolean(disabled && disabledReason);
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next && disabled) {
          if (disabledReason) {
            toast.info(disabledReason, {
              id: `searchable-select-disabled-${disabledReason}`,
            });
          }
          return;
        }
        setOpen(next);
        if (!next) {
          setQuery('');
          setHighlight(0);
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled && !hasDisabledHint}
          aria-disabled={disabled || undefined}
          aria-invalid={hasError || undefined}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          className={cn(
            'inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-card px-4 text-sm text-foreground',
            'transition-[border-color,box-shadow,background-color] duration-150',
            'focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            disabled && 'cursor-not-allowed opacity-50',
            hasError
              ? 'border-destructive focus-visible:border-destructive focus-visible:shadow-[var(--shadow-focus-destructive)]'
              : 'border-border-medium hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[var(--shadow-focus-accent)]',
            className
          )}
        >
          <span className={cn('truncate', !selectedItem && 'text-light-foreground')}>
            {selectedItem ? getLabel(selectedItem) : placeholder}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className="shrink-0 text-muted-foreground"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          // Manually focus the search input without scroll-into-view. iOS
          // Safari otherwise scrolls the page up to bring the focused input
          // into the visual viewport, hiding the dropdown above the fold.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchInputRef.current?.focus({ preventScroll: true });
          }}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-border bg-card p-2 shadow-popover"
        >
          <div className="relative mb-2">
            <Search
              size={14}
              strokeWidth={1.5}
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              aria-label="Search items"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeId}
              className="h-9 w-full rounded-lg border border-border-medium bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-light-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-56 overflow-y-auto"
            style={{ overscrollBehavior: 'contain' }}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((it, idx) => {
                const key = getKey(it);
                const isSelected = key === value;
                const isHighlighted = idx === safeHighlight;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      role="option"
                      id={`${listboxId}-${key}`}
                      data-idx={idx}
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => handleSelect(it)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        isHighlighted && 'bg-muted',
                        isSelected && 'text-accent',
                        !isSelected && 'text-foreground',
                        'focus-visible:outline-none focus-visible:bg-muted'
                      )}
                    >
                      <span className="truncate">{renderItem ? renderItem(it) : getLabel(it)}</span>
                      {isSelected && <Check size={14} strokeWidth={2} aria-hidden />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
