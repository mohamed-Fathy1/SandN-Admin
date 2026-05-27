import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type MetricSize = 'lg' | 'md' | 'sm';

export interface MetricDelta {
  value: number;
  direction: 'up' | 'down' | 'flat';
  label?: string;
}

interface MetricValueProps {
  size?: MetricSize;
  delta?: MetricDelta | null;
  /** When the delta direction is "good" vs "bad", this lets you flip the
   *  semantic color (e.g. for an error rate going down = good). Defaults to
   *  "up" being positive. */
  invertDeltaTone?: boolean;
  className?: string;
  children: React.ReactNode;
}

const SIZE: Record<MetricSize, string> = {
  lg: 'text-[length:var(--text-metric-lg)] leading-none',
  md: 'text-[length:var(--text-metric-md)] leading-[1.1]',
  sm: 'text-[length:var(--text-metric-sm)] leading-[1.2]',
};

function deltaTone(direction: MetricDelta['direction'], invert: boolean) {
  if (direction === 'flat') return 'text-muted-foreground bg-muted/60';
  const positive = invert ? direction === 'down' : direction === 'up';
  return positive
    ? 'text-success bg-[rgba(5,150,105,0.10)]'
    : 'text-destructive bg-[rgba(220,38,38,0.10)]';
}

function DeltaIcon({ direction }: { direction: MetricDelta['direction'] }) {
  if (direction === 'up') return <ArrowUpRight aria-hidden="true" size={12} />;
  if (direction === 'down') return <ArrowDownRight aria-hidden="true" size={12} />;
  return <Minus aria-hidden="true" size={12} />;
}

export function MetricValue({
  size = 'lg',
  delta = null,
  invertDeltaTone = false,
  className,
  children,
}: MetricValueProps) {
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span
        className={cn(
          'font-semibold font-tabular tracking-tight text-foreground',
          SIZE[size]
        )}
      >
        {children}
      </span>
      {delta ? (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold font-tabular',
            deltaTone(delta.direction, invertDeltaTone)
          )}
        >
          <DeltaIcon direction={delta.direction} />
          <span>
            {delta.direction === 'down' ? '−' : delta.direction === 'up' ? '+' : ''}
            {Math.abs(delta.value).toFixed(1)}%
          </span>
          <span className="sr-only">{delta.label ?? 'vs previous period'}</span>
        </span>
      ) : null}
    </div>
  );
}
