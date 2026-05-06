import { CountUp } from '../shared/CountUp';

interface StatCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
}

export function StatCard({ label, value, format }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <span style={{
        fontFamily: 'var(--app-font-mono)',
        fontSize: 9,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--app-font-mono)',
        fontSize: 28,
        color: 'var(--text-primary)',
        fontWeight: 700,
        lineHeight: 1,
      }}>
        <CountUp value={value} format={format} />
      </span>
    </div>
  );
}
