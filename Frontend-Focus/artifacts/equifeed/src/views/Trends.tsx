import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { RankBadge } from '../components/shared/RankBadge';
import { PostDetailSheet } from '../components/explore/PostDetailSheet';
import { HashtagCloud } from '../components/trends/HashtagCloud';
import { Loader2 } from 'lucide-react';
import type { Post, TrendingTopic, TrendingHashtag } from '../types';

const TABS = ['Content', 'Topics', 'Hashtags'] as const;
type Tab = typeof TABS[number];

export default function Trends() {
  const [tab, setTab] = useState<Tab>('Content');
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotlightIndex, setSpotlightIndex] = useState<number | null>(null);
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trends');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.topPosts || []);
        setTopics(data.topics || []);
        setHashtags(data.hashtags || []);
      }
    } catch {
      setPosts([]);
      setTopics([]);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => b.finalScore - a.finalScore),
    [posts],
  );

  const topPosts = useMemo(() => sortedPosts.slice(0, 5), [sortedPosts]);

  const bg = isDark ? '#080808' : '#fafafa';
  const bgRaised = isDark ? '#0f0f0f' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#efefef';
  const textPrimary = isDark ? '#f2f2f2' : '#0a0a0a';
  const textMuted = isDark ? '#666' : '#737373';
  const textFaint = isDark ? '#333' : '#ccc';
  const green = isDark ? '#00ff88' : '#00a86b';

  return (
    <div className="app-page" style={{ backgroundColor: bg }}>
      <div className="app-topbar" style={{
        position: 'sticky', top: 0, zIndex: 20,
        backgroundColor: isDark ? 'rgba(8,8,8,0.95)' : 'rgba(255,255,255,0.95)',
        borderBottom: `1px solid ${border}`,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--app-font-sans)', fontWeight: 700, fontSize: 17, color: textPrimary }}>
          Trending
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: isDark ? '#001a0a' : '#e6f9f0',
          border: `1px solid ${green}`,
          padding: '4px 10px',
          borderRadius: '2px',
        }}>
          <span style={{ width: 6, height: 6, backgroundColor: green, borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Live
          </span>
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
      </div>

      <div className="app-content" style={{ padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
        <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
          Right Now
        </p>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {loading ? (
            <div style={{ height: 75, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
              <Loader2 className="animate-spin" size={16} color="var(--text-muted)" />
            </div>
          ) : topPosts.length === 0 ? (
            <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: textMuted }}>No trending content.</p>
          ) : (
            topPosts.map((post) => {
              const score = Math.round(post.finalScore * 100);
              return (
                <button
                  key={post.id}
                  onClick={() => setSpotlightIndex(sortedPosts.findIndex((p) => p.id === post.id))}
                  style={{
                    width: 120, flexShrink: 0,
                    background: 'none', border: `1px solid ${border}`, padding: 0,
                    overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  }}
                >
                  <div style={{ height: 75, position: 'relative', overflow: 'hidden' }}>
                    <img src={post.contentUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      backgroundColor: green,
                      color: '#000',
                      fontFamily: 'var(--app-font-mono)',
                      fontSize: 11, fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '2px',
                    }}>
                      {score}
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', backgroundColor: bgRaised }}>
                    <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: green, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      @{post.creator.username}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="app-content" style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px 8px',
              background: 'none', border: 'none',
              fontFamily: 'var(--app-font-sans)',
              fontSize: 13, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? textPrimary : textMuted,
              cursor: 'pointer',
              borderBottom: tab === t ? `2px solid ${green}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div className="app-content" key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
        {tab === 'Content' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
              </div>
            ) : sortedPosts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--app-font-mono)', fontSize: 11, color: textMuted }}>
                No content found.
              </p>
            ) : (
              sortedPosts.slice(0, 12).map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => setSpotlightIndex(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    background: 'none',
                    borderBottom: `1px solid ${border}`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? '#0f0f0f' : '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: textFaint, minWidth: 20, textAlign: 'right' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ width: 44, height: 44, flexShrink: 0, overflow: 'hidden', backgroundColor: isDark ? '#111' : '#eee' }}>
                    <img src={post.contentUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: green, margin: '0 0 2px', fontWeight: 600 }}>
                      @{post.creator.username}
                    </p>
                    <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.caption}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <RankBadge tier={post.rankTier} />
                    <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: textMuted }}>
                      {Math.round(post.finalScore * 100)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'Topics' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 className="animate-spin" size={24} color="var(--text-muted)"/>
              </div>
            ) : topics.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--app-font-mono)', fontSize: 11, color: textMuted }}>
                No topics actively trending.
              </p>
            ) : (
              topics.map((topic, i) => (
                <div
                  key={topic.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    borderBottom: `1px solid ${border}`,
                  }}
                >
                  <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: textFaint, minWidth: 20, textAlign: 'right' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, fontWeight: 600, color: textPrimary, margin: '0 0 2px' }}>
                      {topic.name}
                    </p>
                    <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: textMuted, margin: 0 }}>
                      {topic.postCount.toLocaleString()} posts
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{
                      fontFamily: 'var(--app-font-mono)', fontSize: 12, fontWeight: 700,
                      color: Math.round(topic.aggregateScore * 100) >= 70 ? green : textMuted,
                    }}>
                      {Math.round(topic.aggregateScore * 100)}
                    </span>
                    <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: topic.trend === 'up' ? green : topic.trend === 'down' ? '#ef4444' : textFaint }}>
                      {topic.trend === 'up' ? '↑' : topic.trend === 'down' ? '↓' : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'Hashtags' && (
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
            </div>
          ) : hashtags.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--app-font-mono)', fontSize: 11, color: textMuted }}>
              No hashtags actively trending.
            </p>
          ) : (
            <HashtagCloud hashtags={hashtags} />
          )
        )}
      </motion.div>

      <PostDetailSheet posts={sortedPosts} initialIndex={spotlightIndex} onClose={() => setSpotlightIndex(null)} />
    </div>
  );
}
