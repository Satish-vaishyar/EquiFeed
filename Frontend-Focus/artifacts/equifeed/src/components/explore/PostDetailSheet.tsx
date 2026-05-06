import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Post } from '../../types';
import { ActionBar } from '../feed/ActionBar';
import { CaptionOverlay } from '../feed/CaptionOverlay';
import { CommentSheet } from '../feed/CommentSheet';

interface PostDetailSheetProps {
  posts?: Post[];
  initialIndex: number | null;
  onClose: () => void;
}

export function PostDetailSheet({ posts = [], initialIndex, onClose }: PostDetailSheetProps) {
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialIndex !== null && scrollRef.current) {
      const node = scrollRef.current;
      requestAnimationFrame(() => {
        node.scrollTo({
          top: initialIndex * node.clientHeight,
          behavior: 'auto',
        });
      });
    }
  }, [initialIndex]);

  const isOpen = initialIndex !== null && posts.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200 }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{ position: 'fixed', inset: 0, zIndex: 201 }}
          >
            <div
              ref={scrollRef}
              style={{
                height: '100%',
                overflowY: 'scroll',
                scrollSnapType: 'y mandatory',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                scrollbarWidth: 'none',
              }}
            >
              {posts.map((post) => (
                <PostSlide
                  key={post.id}
                  post={post}
                  onClose={onClose}
                  onCommentClick={() => setCommentPostId(post.id)}
                />
              ))}
            </div>
          </motion.div>

          <CommentSheet
            postId={commentPostId ?? ''}
            open={commentPostId !== null}
            onClose={() => setCommentPostId(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
}

function PostSlide({
  post,
  onClose,
  onCommentClick,
}: {
  post: Post;
  onClose: () => void;
  onCommentClick: () => void;
}) {
  return (
    <div
      style={{
        height: '100dvh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        flexShrink: 0,
        position: 'relative',
        backgroundColor: '#000',
      }}
    >
      {post.contentType === 'VIDEO' ? (
        <video
          src={post.contentUrl}
          playsInline
          muted
          autoPlay
          loop
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <img
          src={post.contentUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 52, right: 16, zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', padding: 8, cursor: 'pointer', display: 'flex',
        }}
      >
        <X size={18} />
      </button>

      <ActionBar post={post} onCommentClick={onCommentClick} />
      <CaptionOverlay post={post} />
    </div>
  );
}
