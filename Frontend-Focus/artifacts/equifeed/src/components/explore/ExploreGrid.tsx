import { useState } from 'react';
import type { Post } from '../../types';
import { useUserStore } from '../../store/userStore';
import { PostDetailSheet } from './PostDetailSheet';

interface ExploreGridProps {
  posts: Post[];
}

export function ExploreGrid({ posts }: ExploreGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === 'dark';

  if (posts.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 14, color: isDark ? '#666' : '#737373' }}>
          No results found.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="explore-grid">
        {posts.map((post, i) => (
          <button
            key={post.id}
            onClick={() => setSelectedIndex(i)}
            style={{
              aspectRatio: '1 / 1',
              overflow: 'hidden',
              display: 'block',
              padding: 0, border: 'none',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: isDark ? '#141414' : '#e8e8e8',
            }}
          >
            <img
              src={post.contentUrl}
              alt={post.caption ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
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
