import { useState } from 'react';
import type { Post } from '../../types';
import { RankBadge } from '../shared/RankBadge';
import { PostDetailSheet } from '../explore/PostDetailSheet';

interface TrendingContentProps {
  posts: Post[];
}

export function TrendingContent({ posts }: TrendingContentProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {posts.map((post, i) => (
          <button
            key={post.id}
            onClick={() => setSelectedIndex(i)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'none',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-raised)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span style={{
              fontFamily: 'var(--app-font-mono)',
              fontSize: 24,
              color: 'var(--text-faint)',
              minWidth: 32,
              textAlign: 'right',
              fontWeight: 700,
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{
              width: 56, height: 56, flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--bg-subtle)',
            }}>
              <img src={post.contentUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                @{post.creator.username}
              </span>
              <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.caption}
              </p>
            </div>
            <RankBadge tier={post.rankTier} />
          </button>
        ))}
      </div>
      <PostDetailSheet
        posts={posts}
        initialIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </>
  );
}
