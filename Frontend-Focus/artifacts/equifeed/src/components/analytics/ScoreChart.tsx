import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PostAnalytics } from '../../types';

interface ScoreChartProps {
  posts: PostAnalytics[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', padding: '8px 12px' }}>
      <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>POST {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: p.fill, margin: '2px 0' }}>
          {p.name}: {Math.round(p.value * 100)}
        </p>
      ))}
    </div>
  );
};

export function ScoreChart({ posts }: ScoreChartProps) {
  const data = posts.map((p, i) => ({
    post: i + 1,
    Quality: p.qualityScore,
    Relevance: p.relevanceScore,
    Fairness: p.fairnessScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="post"
          tick={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          tick={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v * 100)}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        />
        <Bar dataKey="Quality" fill="#7c3aed" radius={0} />
        <Bar dataKey="Relevance" fill="#f59e0b" radius={0} />
        <Bar dataKey="Fairness" fill="#00ff88" radius={0} />
      </BarChart>
    </ResponsiveContainer>
  );
}
