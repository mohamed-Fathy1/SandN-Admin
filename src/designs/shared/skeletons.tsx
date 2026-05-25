import { cn } from '@/shared/utils/cn';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('shimmer rounded-lg', className)} aria-hidden {...props} />;
}

const SKELETON_WIDTHS = ['w-1/2', 'w-3/5', 'w-2/3', 'w-3/4', 'w-4/5'] as const;
const HEADER_WIDTHS = ['w-16', 'w-20', 'w-24', 'w-14'] as const;

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="border-b border-border bg-muted/50 px-6 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cn('h-3', HEADER_WIDTHS[i % HEADER_WIDTHS.length])} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton
                  key={c}
                  className={cn('h-4', SKELETON_WIDTHS[(r * 7 + c * 3) % SKELETON_WIDTHS.length])}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <TableSkeleton />
    </div>
  );
}

export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/3] w-full" />
      ))}
    </div>
  );
}
