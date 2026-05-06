import { useEffect, useRef } from 'react';
import { useFeedStore } from '../../store/feedStore';
import { FeedItem } from './FeedItem';

export function FeedContainer() {
  const { posts, isLoading, isLoadingMore, hasMore, initFeed, loadMore } = useFeedStore();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (posts.length === 0) void initFeed();
  }, [initFeed, posts.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          void loadMore();
        }
      },
      { rootMargin: '800px 0px' }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  if (isLoading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 36, height: 36,
            border: '2px solid #00ff88', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Loading
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {posts.map((post, index) => (
        <FeedItem key={post.id} post={post} priority={index === 0} />
      ))}
      <div ref={sentinelRef} className="feed-loader">
        {isLoadingMore ? 'Loading more posts' : hasMore ? 'Scroll for more' : 'You are all caught up'}
      </div>
    </div>
  );
}
