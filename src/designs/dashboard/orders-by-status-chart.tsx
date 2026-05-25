import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OrderStatus } from '@/config/constants';

export interface StatusCountDatum {
  status: OrderStatus;
  label: string;
  count: number;
}

interface OrdersByStatusChartProps {
  data: StatusCountDatum[];
}

export default function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const height = Math.max(160, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
      >
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={108}
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-muted)', opacity: 0.35 }}
          formatter={(value: number) => [value, 'Orders']}
          labelStyle={{ color: 'var(--color-foreground)' }}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-card)',
          }}
        />
        <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
