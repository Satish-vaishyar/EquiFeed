import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { PostAnalytics } from '../../types';
import { RankBadge } from '../shared/RankBadge';
import { formatCount, timeAgo } from '../../lib/utils';

type SortKey = keyof Pick<PostAnalytics, 'finalScore' | 'likesCount' | 'commentsCount' | 'exposure'>;

interface PostsTableProps {
  posts: PostAnalytics[];
}

export function PostsTable({ posts }: PostsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('finalScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...posts].sort((a, b) => {
    const diff = (a[sortKey] as number) - (b[sortKey] as number);
    return sortDir === 'asc' ? diff : -diff;
  });

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>↕</span>;
    return sortDir === 'asc'
      ? <ChevronUp size={12} color="var(--green)" />
      : <ChevronDown size={12} color="var(--green)" />;
  };

  const thStyle: React.CSSProperties = {
    fontFamily: 'var(--app-font-mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const tdStyle: React.CSSProperties = {
    fontFamily: 'var(--app-font-mono)',
    fontSize: 11,
    color: 'var(--text-primary)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <th style={thStyle}>Post</th>
            <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('finalScore')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Score <SortIcon k="finalScore" /></span>
            </th>
            <th style={thStyle}>Tier</th>
            <th style={{ ...thStyle }} onClick={() => handleSort('likesCount')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Likes <SortIcon k="likesCount" /></span>
            </th>
            <th style={{ ...thStyle }} onClick={() => handleSort('commentsCount')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Cmts <SortIcon k="commentsCount" /></span>
            </th>
            <th style={{ ...thStyle }} onClick={() => handleSort('exposure')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Views <SortIcon k="exposure" /></span>
            </th>
            <th style={thStyle}>Posted</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.postId}
              style={{ transition: 'background-color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
                    <img src={p.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.caption}
                  </span>
                </div>
              </td>
              <td style={{ ...tdStyle, color: 'var(--green)', fontWeight: 700 }}>
                {Math.round(p.finalScore * 100)}
              </td>
              <td style={tdStyle}>
                <RankBadge tier={p.rankTier} />
              </td>
              <td style={tdStyle}>{formatCount(p.likesCount)}</td>
              <td style={tdStyle}>{p.commentsCount}</td>
              <td style={tdStyle}>{formatCount(p.exposure)}</td>
              <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{timeAgo(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
