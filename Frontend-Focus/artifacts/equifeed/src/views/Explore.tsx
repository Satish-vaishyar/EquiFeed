import { useState, useMemo, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { ExploreGrid } from '../components/explore/ExploreGrid';
import type { Post } from '../types';

export default function Explore() {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === 'dark';

  const bg = isDark ? '#080808' : '#fafafa';
  const border = isDark ? '#1f1f1f' : '#efefef';
  const textPrimary = isDark ? '#f2f2f2' : '#0a0a0a';
  const textMuted = isDark ? '#666' : '#737373';
  const inputBg = isDark ? '#1a1a1a' : '#efefef';

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch explore posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.caption?.toLowerCase().includes(q) ||
        p.hashtags.some((h) => h.includes(q)) ||
        p.creator.username.includes(q)
    );
  }, [query, posts]);

  return (
    <div className="app-page" style={{ backgroundColor: bg }}>
      {/* Sticky header */}
      <div className="app-topbar" style={{
        position: 'sticky', top: 0, zIndex: 20,
        backgroundColor: isDark ? 'rgba(8,8,8,0.95)' : 'rgba(255,255,255,0.95)',
        borderBottom: `1px solid ${border}`,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <span style={{
          fontFamily: 'var(--app-font-sans)',
          fontWeight: 700, fontSize: 17,
          color: textPrimary, flexShrink: 0,
        }}>
          Explore
        </span>

        <div style={{ position: 'relative', flex: 1, maxWidth: 240 }}>
          <Search size={14} color={textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, tags, creators..."
            style={{
              width: '100%',
              backgroundColor: inputBg,
              border: `1px solid ${border}`,
              color: textPrimary,
              fontFamily: 'var(--app-font-sans)',
              fontSize: 13,
              padding: '8px 12px 8px 32px',
              outline: 'none',
              borderRadius: '8px',
            }}
          />
        </div>
      </div>

      <motion.div className="app-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : (
          <ExploreGrid posts={filtered} />
        )}
      </motion.div>
    </div>
  );
}
