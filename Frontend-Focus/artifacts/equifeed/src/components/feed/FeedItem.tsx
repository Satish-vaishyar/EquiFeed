import { memo, useState } from 'react';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { Link } from 'wouter';
import type { Post } from '../../types';
import { useFeedStore } from '../../store/feedStore';
import { formatCount, timeAgo } from '../../lib/utils';
import { CommentSheet } from './CommentSheet';

interface FeedItemProps {
  post: Post;
  priority?: boolean;
}

function FeedItemComponent({ post, priority = false }: FeedItemProps) {
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const [commentOpen, setCommentOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = () => {
    setLiked((value) => !value);
    setLikesCount((value) => (liked ? value - 1 : value + 1));
    toggleLike(post.id);
  };

  return (
    <article className="feed-item">
      <header className="post-header">
        <Link href={`/profile/${post.creator.username}`}>
          <div className="post-user">
            <img
              className="post-avatar"
              src={post.creator.avatarUrl}
              alt={post.creator.displayName}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
            />
            <div>
              <p>{post.creator.username}</p>
              <span>{post.creator.displayName}</span>
            </div>
          </div>
        </Link>

        <button className="icon-button" aria-label="More options">
          <MoreHorizontal size={22} />
        </button>
      </header>

      <div className="post-media">
        {post.contentType === 'VIDEO' ? (
          <video src={post.contentUrl} playsInline muted controls preload="metadata" />
        ) : (
          <img
            src={post.contentUrl}
            alt={post.caption ?? ''}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
          />
        )}
      </div>

      <div className="post-actions">
        <div>
          <button className="icon-button" onClick={handleLike} aria-label={liked ? 'Unlike post' : 'Like post'}>
            <Heart size={25} fill={liked ? 'var(--red)' : 'transparent'} stroke={liked ? 'var(--red)' : 'currentColor'} />
          </button>
          <button className="icon-button" onClick={() => setCommentOpen(true)} aria-label="View comments">
            <MessageCircle size={25} />
          </button>
          <button className="icon-button" aria-label="Share post">
            <Send size={24} />
          </button>
        </div>

        <button className="icon-button" onClick={() => setSaved((value) => !value)} aria-label={saved ? 'Unsave post' : 'Save post'}>
          <Bookmark size={25} fill={saved ? 'currentColor' : 'transparent'} />
        </button>
      </div>

      <div className="post-body">
        <strong>{formatCount(likesCount)} likes</strong>

        {post.caption && (
          <p>
            <Link href={`/profile/${post.creator.username}`}>
              <span>{post.creator.username}</span>
            </Link>{' '}
            {post.caption}
          </p>
        )}

        {post.hashtags.length > 0 && (
          <div className="post-tags">
            {post.hashtags.map((tag) => (
              <Link key={tag} href={`/trends?tag=${tag}`}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <button className="comments-link" onClick={() => setCommentOpen(true)}>
          View all {formatCount(post.commentsCount)} comments
        </button>

        <time>{timeAgo(post.createdAt)}</time>
      </div>

      {commentOpen && <CommentSheet postId={post.id} open onClose={() => setCommentOpen(false)} />}
    </article>
  );
}

export const FeedItem = memo(FeedItemComponent);
