import { useState } from 'react';
import type { Post } from '../../types';
import { PostDetailSheet } from '../explore/PostDetailSheet';

interface ProfileGridProps {
  posts: Post[];
}

export function ProfileGrid({ posts }: ProfileGridProps) {
  const [selected, setSelected] = useState<Post | null>(null);

  if (posts.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          No posts yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => setSelected(post)}
            style={{
              aspectRatio: '1 / 1',
              overflow: 'hidden',
              display: 'block',
              padding: 0,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: 'var(--bg-subtle)',
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
      <PostDetailSheet post={selected} onClose={() => setSelected(null)} />
    </>
  );
}
