import type { OrderStatus } from '@/config/constants';
import { formatNumber } from '@/shared/utils/format';

export interface StatusCountDatum {
  status: OrderStatus;
  label: string;
  count: number;
}

interface OrdersByStatusChartProps {
  data: StatusCountDatum[];
}

/**
 * Horizontal status bars. Built with CSS instead of Recharts so:
 * - Zero-count rows still get a visible baseline track + numeric label.
 * - Status color of each row matches the order-status palette (not just accent).
 * - Density / alignment stays consistent with the rest of the dashboard.
 */
export default function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <ul role="list" className="space-y-2.5">
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const isZero = d.count === 0;
        return (
          <li key={d.status} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3">
            <span
              className="truncate text-xs font-medium text-muted-foreground"
              title={d.label}
            >
              {d.label}
            </span>
            <div
              className="relative h-2.5 overflow-hidden rounded-full bg-muted/70"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={d.count}
              aria-label={`${d.label}: ${d.count} orders`}
            >
              <span
                aria-hidden
                className="block h-full rounded-full transition-[width] duration-500"
                style={{
                  width: isZero ? '0%' : `${Math.max(2, pct)}%`,
                  background: `var(--color-status-${d.status.replace('_', '-')})`,
                }}
              />
            </div>
            <span
              className={
                isZero
                  ? 'text-right text-xs font-tabular text-light-foreground'
                  : 'text-right text-xs font-semibold font-tabular text-foreground'
              }
            >
              {formatNumber(d.count)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
