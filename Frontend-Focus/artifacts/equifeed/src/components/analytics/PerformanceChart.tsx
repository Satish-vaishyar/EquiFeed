import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DailyScore } from '../../types';

interface PerformanceChartProps {
  data: DailyScore[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', padding: '8px 12px' }}>
      <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 12, color: 'var(--green)', margin: 0 }}>
        Score: {Math.round(payload[0].value * 100)}
      </p>
    </div>
  );
};

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="date"
          tick={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          domain={[0.5, 1]}
          tick={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v * 100)}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-focus)' }} />
        <ReferenceLine
          y={0.70}
          stroke="var(--text-faint)"
          strokeDasharray="4 2"
          label={{
            value: 'HIGH threshold',
            position: 'insideTopRight',
            style: { fontFamily: 'var(--app-font-mono)', fontSize: 8, fill: 'var(--text-muted)' },
          }}
        />
        <Line
          type="monotone"
          dataKey="avgScore"
          stroke="var(--green)"
          strokeWidth={1.5}
          dot={{ fill: 'var(--green)', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 4, fill: 'var(--green)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
