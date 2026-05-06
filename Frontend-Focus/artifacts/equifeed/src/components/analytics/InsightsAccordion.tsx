import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { PostAnalytics } from '../../types';

interface InsightsAccordionProps {
  posts: PostAnalytics[];
}

export function InsightsAccordion({ posts }: InsightsAccordionProps) {
  const lowPosts = posts.filter((p) => p.rankTier === 'LOW');
  const [openId, setOpenId] = useState<string | null>(null);

  if (lowPosts.length === 0) {
    return (
      <div style={{ padding: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
        <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
          No low-tier posts. All content performing well.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {lowPosts.map((p) => (
        <div key={p.postId} style={{ border: '1px solid var(--border)' }}>
          <button
            onClick={() => setOpenId(openId === p.postId ? null : p.postId)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--bg-raised)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: openId === p.postId ? '2px solid var(--red)' : '2px solid transparent',
            }}
          >
            <div style={{ width: 36, height: 36, flexShrink: 0, overflow: 'hidden', backgroundColor: 'var(--bg-subtle)' }}>
              <img src={p.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ flex: 1, fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.caption}
            </p>
            <motion.div animate={{ rotate: openId === p.postId ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} color="var(--text-muted)" />
            </motion.div>
          </button>

          <AnimatePresence>
            {openId === p.postId && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, margin: '0 0 8px 0' }}>
                    AI Insight
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                    {p.feedback ?? 'Content relevance is below the HIGH threshold. Consider improving hashtag targeting, caption clarity, and content quality. Try posting at peak hours for better initial engagement signals.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
