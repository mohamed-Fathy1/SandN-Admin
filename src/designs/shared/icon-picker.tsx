import { useMemo, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/shared/utils/cn';
import type { ApiCategoryIcon } from '@/shared/types/api';

interface IconPickerProps {
  icons: ApiCategoryIcon[];
  value: string | undefined;
  onChange: (iconId: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  /** Only show icons with `isActive=true`. Defaults to true. */
  activeOnly?: boolean;
  emptyHint?: string;
}

export function IconPicker({
  icons,
  value,
  onChange,
  isLoading,
  isError,
  disabled,
  hasError,
  activeOnly = true,
  emptyHint = 'No icons available — create one first.',
}: IconPickerProps) {
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const base = activeOnly ? icons.filter((i) => i.isActive) : icons;
    const term = search.trim().toLowerCase();
    if (!term) return base;
    return base.filter((i) => i.key.toLowerCase().includes(term));
  }, [icons, activeOnly, search]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dashed border-border-medium bg-card/50 px-4 py-6 text-center text-xs text-light-foreground">
        Loading icons…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <AlertCircle size={13} strokeWidth={1.75} aria-hidden />
        Failed to load icons.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-colors',
        hasError ? 'border-destructive' : 'border-border-medium'
      )}
    >
      <div className="border-b border-border p-2">
        <Input
          type="search"
          placeholder="Search icons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          leadingIcon={<Search size={13} strokeWidth={1.75} aria-hidden />}
          className="h-9"
        />
      </div>

      {visible.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-light-foreground">
          {icons.length === 0 ? emptyHint : 'No matches for the search term.'}
        </div>
      ) : (
        <div
          role="radiogroup"
          aria-label="Choose an icon"
          className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto p-3 sm:grid-cols-6 md:grid-cols-8"
          style={{ overscrollBehavior: 'contain' }}
        >
          {visible.map((icon) => {
            const selected = icon._id === value;
            return (
              <button
                key={icon._id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={icon.key}
                title={icon.key}
                disabled={disabled}
                onClick={() => onChange(icon._id)}
                className={cn(
                  'group relative flex aspect-square items-center justify-center rounded-lg border transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  selected
                    ? 'border-accent bg-accent/10 shadow-card'
                    : 'border-border bg-card hover:border-accent/40 hover:bg-muted'
                )}
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center text-foreground [&_svg]:h-full [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
