import { motion } from 'framer-motion';

interface ScoreBarProps {
  value: number;
  label: string;
  color?: string;
}

export function ScoreBar({ value, label, color = 'var(--green)' }: ScoreBarProps) {
  const pct = Math.round(value * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--app-font-mono)',
            fontSize: 9,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--app-font-mono)',
            fontSize: 11,
            color,
            fontWeight: 600,
          }}
        >
          {pct}
        </span>
      </div>
      <div
        style={{
          height: 3,
          backgroundColor: 'var(--bg-subtle)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', backgroundColor: color }}
        />
      </div>
    </div>
  );
}
