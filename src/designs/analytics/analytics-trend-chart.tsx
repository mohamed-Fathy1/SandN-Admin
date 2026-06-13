import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import i18n from '@/i18n';
import { formatNumber } from '@/shared/utils/format';
import type { AnalyticsOverviewRow } from '@/shared/types/api';

export type TrendMetric = 'activeUsers' | 'sessions' | 'screenPageViews' | 'newUsers';

interface AnalyticsTrendChartProps {
  data: AnalyticsOverviewRow[];
  metric: TrendMetric;
  /** Localized series label, shown in the tooltip. */
  metricLabel: string;
}

// Short ranges (a single day or a week) read far better as bars — a lone point
// in an area chart looks empty. Longer ranges get a smooth filled trend line.
const BAR_THRESHOLD = 7;

function shortDate(id: string): string {
  const d = new Date(id);
  if (Number.isNaN(d.getTime())) return id;
  const locale = (i18n.language || 'ar').startsWith('ar') ? 'ar-EG' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

const AXIS_TICK = { fontSize: 11, fill: 'var(--color-muted-foreground)' } as const;
const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-card)',
} as const;
const yTickFormatter = (value: number) =>
  value >= 1000 ? `${Math.round(value / 1000)}k` : String(value);

export default function AnalyticsTrendChart({
  data,
  metric,
  metricLabel,
}: AnalyticsTrendChartProps) {
  const prepared = data.map((d) => ({ ...d, label: shortDate(d.date) }));
  const useBars = prepared.length <= BAR_THRESHOLD;

  if (useBars) {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={prepared} margin={{ top: 12, right: 8, left: -16, bottom: 4 }}>
          <defs>
            <linearGradient id="analytics-bar-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tickFormatter={yTickFormatter}
            width={44}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-accent)', fillOpacity: 0.08 }}
            formatter={(value: number) => [formatNumber(value), metricLabel]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar
            dataKey={metric}
            fill="url(#analytics-bar-fill)"
            radius={[6, 6, 0, 0]}
            maxBarSize={56}
          >
            <LabelList
              dataKey={metric}
              position="top"
              formatter={(value: number) => formatNumber(value)}
              style={{ fill: 'var(--color-foreground)', fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={prepared} margin={{ top: 12, right: 8, left: -16, bottom: 4 }}>
        <defs>
          <linearGradient id="analytics-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={yTickFormatter}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.2 }}
          formatter={(value: number) => [formatNumber(value), metricLabel]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke="var(--color-accent)"
          strokeWidth={2}
          fill="url(#analytics-trend-fill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
