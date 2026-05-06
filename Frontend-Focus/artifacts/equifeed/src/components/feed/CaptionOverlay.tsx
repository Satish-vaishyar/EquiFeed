import { useState } from 'react';
import { Link } from 'wouter';
import type { Post } from '../../types';

interface CaptionOverlayProps {
  post: Post;
}

export function CaptionOverlay({ post }: CaptionOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 16,
      right: 80,
      zIndex: 10,
    }}>
      <Link href={`/profile/${post.creator.username}`}>
        <span style={{
          display: 'block',
          fontFamily: 'var(--app-font-mono)',
          fontSize: 13,
          fontWeight: 700,
          color: 'white',
          marginBottom: 4,
          cursor: 'pointer',
        }}>
          @{post.creator.username}
        </span>
      </Link>

      {post.caption && (
        <div style={{ marginBottom: 6 }}>
          <p style={{
            fontSize: 13,
            color: 'white',
            lineHeight: 1.4,
            margin: 0,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: expanded ? undefined : 2,
            overflow: expanded ? 'visible' : 'hidden',
          }}>
            {post.caption}
          </p>
          {post.caption.length > 80 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--app-font-mono)',
              }}
            >
              ...more
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {post.hashtags.map((tag) => (
          <Link key={tag} href={`/trends?tag=${tag}`}>
            <span style={{
              fontFamily: 'var(--app-font-mono)',
              fontSize: 11,
              color: 'var(--green)',
              cursor: 'pointer',
            }}>
              #{tag}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
