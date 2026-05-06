import type { RankTier } from '../../types';

interface RankBadgeProps {
  tier: RankTier;
  size?: 'sm' | 'md';
}

export function RankBadge({ tier, size = 'sm' }: RankBadgeProps) {
  const colors: Record<RankTier, { bg: string; color: string }> = {
    HIGH: { bg: 'var(--green-dim)', color: 'var(--green)' },
    MEDIUM: { bg: 'var(--amber-dim)', color: 'var(--amber)' },
    LOW: { bg: 'var(--red-dim)', color: 'var(--red)' },
  };

  const { bg, color } = colors[tier];

  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        fontFamily: 'var(--app-font-mono)',
        fontSize: size === 'sm' ? 9 : 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        padding: '2px 6px',
        borderRadius: 2,
        border: `1px solid ${color}33`,
        display: 'inline-block',
        lineHeight: 1.4,
      }}
    >
      {tier}
    </span>
  );
}
