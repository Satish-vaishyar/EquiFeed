import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useFeedStore } from '../../store/feedStore';
import { formatCount } from '../../lib/utils';
import type { Post } from '../../types';

interface ActionBarProps {
  post: Post;
  onCommentClick: () => void;
}

export function ActionBar({ post, onCommentClick }: ActionBarProps) {
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const [shareCount, setShareCount] = useState(post.shares);
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [likeScale, setLikeScale] = useState(1);

  const handleLike = () => {
    setLiked((v) => !v);
    setLikesCount((v) => liked ? v - 1 : v + 1);
    toggleLike(post.id);
    setLikeScale(1.3);
    setTimeout(() => setLikeScale(1), 200);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'EquiFeed Post', text: post.caption, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setShareCount((v) => v + 1);
    } catch {
      // user cancelled
    }
  };

  return (
    <div style={{
      position: 'absolute',
      right: 12,
      bottom: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      alignItems: 'center',
      zIndex: 10,
    }}>
      <button onClick={handleLike} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ transform: `scale(${likeScale})`, transition: 'transform 160ms ease' }}>
          <Heart
            size={26}
            fill={liked ? 'var(--red)' : 'transparent'}
            stroke={liked ? 'var(--red)' : 'white'}
            strokeWidth={1.5}
          />
        </div>
        <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: 'white', fontWeight: 600 }}>
          {formatCount(likesCount)}
        </span>
      </button>

      <button onClick={onCommentClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
        <MessageCircle size={26} stroke="white" strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: 'white', fontWeight: 600 }}>
          {formatCount(post.commentsCount)}
        </span>
      </button>

      <button onClick={handleShare} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
        <Share2 size={24} stroke="white" strokeWidth={1.5} />
        <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: 'white', fontWeight: 600 }}>
          {formatCount(shareCount)}
        </span>
      </button>
    </div>
  );
}
