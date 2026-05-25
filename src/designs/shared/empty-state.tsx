import { Inbox, SearchX, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { FloatingOrb } from './motion';
import { Button } from './button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  /** Show ambient floating-orb decor behind the icon. Default false. */
  decor?: boolean;
  /**
   * Context variant. `no-results` is shown after a filter/search returns
   * nothing — pass `onClearFilters` to render a Clear CTA.
   */
  variant?: 'no-data' | 'no-results';
  onClearFilters?: () => void;
}

const DEFAULTS = {
  'no-data': {
    title: 'Nothing here yet',
    description: 'New entries will appear here.',
    icon: Inbox,
  },
  'no-results': {
    title: 'No matches',
    description: 'Try a different search or clear active filters.',
    icon: SearchX,
  },
} as const;

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  decor = false,
  variant = 'no-data',
  onClearFilters,
}: EmptyStateProps) {
  const defaults = DEFAULTS[variant];
  const resolvedTitle = title ?? defaults.title;
  const resolvedDescription = description ?? defaults.description;
  const Icon = icon ?? defaults.icon;
  const resolvedAction =
    action ??
    (variant === 'no-results' && onClearFilters ? (
      <Button variant="outline" size="sm" onClick={onClearFilters}>
        Clear filters
      </Button>
    ) : null);
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border-medium bg-card px-6 py-14 text-center',
        className
      )}
    >
      {decor ? (
        <>
          <FloatingOrb
            size={180}
            color="rgba(191,60,104,0.18)"
            top="-40px"
            left="20%"
            delay={0}
            opacity={0.35}
          />
          <FloatingOrb
            size={140}
            color="rgba(217,119,6,0.14)"
            bottom="-30px"
            right="18%"
            delay={1.5}
            opacity={0.3}
          />
        </>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(40% 50% at 50% 0%, rgba(191,60,104,0.04), transparent 70%)',
        }}
      />
      <div
        className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full text-accent"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(191,60,104,0.14), rgba(191,60,104,0.04))',
        }}
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="relative m-0 font-display text-xl italic leading-tight text-foreground">
        {resolvedTitle}
      </h3>
      {resolvedDescription ? (
        <p className="relative mt-1.5 max-w-sm text-sm text-muted-foreground">
          {resolvedDescription}
        </p>
      ) : null}
      {resolvedAction ? <div className="relative mt-5">{resolvedAction}</div> : null}
    </div>
  );
}
