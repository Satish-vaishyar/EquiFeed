import { useLocation } from 'wouter';
import type { TrendingTopic } from '../../types';

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  const [, navigate] = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {topics.map((topic, i) => (
        <button
          key={topic.name}
          onClick={() => navigate(`/explore?tag=${topic.name}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: 'none',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-raised)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--text-faint)', minWidth: 24 }}>
            {i + 1}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 15, color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
              #{topic.name}
            </p>
            <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              {topic.postCount.toLocaleString()} posts
            </span>
          </div>
          <span style={{ color: 'var(--green)', fontSize: 14, fontWeight: 700 }}>▲</span>
        </button>
      ))}
    </div>
  );
}
