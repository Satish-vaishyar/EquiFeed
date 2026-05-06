import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import type { Comment } from '../../types';
import { timeAgo } from '../../lib/utils';
import { useFeedStore } from '../../store/feedStore';

interface CommentSheetProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export function CommentSheet({ postId, open, onClose }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addCommentToFeed = useFeedStore((s) => s.addComment);

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendComment = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [data.comment, ...prev]);
        addCommentToFeed(postId);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100,
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '70vh',
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Comments
              </span>
              <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                  <Loader2 className="animate-spin" size={20} color="var(--text-muted)" />
                </div>
              ) : comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--app-font-mono)', fontSize: 11, textAlign: 'center', marginTop: 32 }}>
                  No comments yet. Be first.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden',
                    }}>
                      {c.user.avatarUrl && <img src={c.user.avatarUrl} alt="" style={{ width: '100%', height: '100%' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                          @{c.user.username}
                        </span>
                        <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                          {timeAgo(c.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.4 }}>{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', backgroundColor: 'var(--bg)' }}>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--app-font-mono)',
                  fontSize: 12,
                  padding: '8px 12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={sendComment}
                style={{
                  backgroundColor: 'var(--green)',
                  color: '#000',
                  border: 'none',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
