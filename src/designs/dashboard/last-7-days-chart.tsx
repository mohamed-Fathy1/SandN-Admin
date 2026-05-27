import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatEGP } from '@/shared/utils/format';

export interface DailyDatum {
  _id: string; // YYYY-MM-DD
  total: number;
  orders: number;
}

interface Last7DaysChartProps {
  data: DailyDatum[];
  mode?: 'revenue' | 'orders';
}

function shortDate(id: string): string {
  // expects YYYY-MM-DD
  const d = new Date(id);
  if (Number.isNaN(d.getTime())) return id;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Last7DaysChart({ data, mode = 'revenue' }: Last7DaysChartProps) {
  const prepared = data.map((d) => ({
    ...d,
    label: shortDate(d._id),
  }));

  if (mode === 'orders') {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={prepared} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.2 }}
            formatter={(value: number) => [value, 'Orders']}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-card)',
            }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent)', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={prepared} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
        <defs>
          <linearGradient id="last7-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) =>
            value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
          }
        />
        <Tooltip
          cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.2 }}
          formatter={(value: number) => [formatEGP(value), 'Revenue']}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-card)',
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--color-accent)"
          strokeWidth={2}
          fill="url(#last7-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
