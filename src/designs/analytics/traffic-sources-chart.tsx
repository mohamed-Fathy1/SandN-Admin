import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/shared/utils/format';
import { TRAFFIC_SOURCE_COLORS } from './palette';

export interface TrafficSourceDatum {
  source: string; // raw GA source — stable React key
  label: string; // localized display name
  sessions: number;
}

interface TrafficSourcesChartProps {
  data: TrafficSourceDatum[];
}

export default function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="sessions"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={2}
          stroke="var(--color-card)"
          strokeWidth={2}
        >
          {data.map((entry, idx) => (
            <Cell
              key={entry.source}
              fill={TRAFFIC_SOURCE_COLORS[idx % TRAFFIC_SOURCE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [formatNumber(value), name]}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-card)',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
