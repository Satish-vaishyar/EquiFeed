import { useLocation } from 'wouter';
import type { TrendingHashtag } from '../../types';

interface HashtagCloudProps {
  hashtags: TrendingHashtag[];
}

export function HashtagCloud({ hashtags }: HashtagCloudProps) {
  const [, navigate] = useLocation();
  const maxCount = Math.max(...hashtags.map((h) => h.postCount));

  const getSize = (count: number): { fontSize: number; padding: string } => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return { fontSize: 15, padding: '6px 14px' };
    if (ratio > 0.4) return { fontSize: 12, padding: '5px 10px' };
    return { fontSize: 10, padding: '4px 8px' };
  };

  const isTopFive = (i: number) => i < 5;

  return (
    <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {hashtags.map((hashtag, i) => {
        const { fontSize, padding } = getSize(hashtag.postCount);
        return (
          <button
            key={hashtag.tag}
            onClick={() => navigate(`/explore?tag=${hashtag.tag}`)}
            style={{
              fontFamily: 'var(--app-font-mono)',
              fontSize,
              padding,
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: isTopFive(i) ? 'var(--green)' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              borderRadius: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            #{hashtag.tag}
          </button>
        );
      })}
    </div>
  );
}
