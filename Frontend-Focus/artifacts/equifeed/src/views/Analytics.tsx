import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { ScoreChart } from '../components/analytics/ScoreChart';
import { PerformanceChart } from '../components/analytics/PerformanceChart';
import { PostsTable } from '../components/analytics/PostsTable';
import { InsightsAccordion } from '../components/analytics/InsightsAccordion';
import { formatCount } from '../lib/utils';
import { CountUp } from '../components/shared/CountUp';
import type { DailyScore, Post, PostAnalytics } from '../types';

const RANGES = ['Last 7d', 'Last 30d', 'All time'] as const;

export default function Analytics() {
  const role = useUserStore((s) => s.role);
  const syncAuthenticatedUser = useUserStore((s) => s.syncAuthenticatedUser);
  const theme = useUserStore((s) => s.theme);
  const [range, setRange] = useState('Last 7d');
  const [posts, setPosts] = useState<PostAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleStatus, setRoleStatus] = useState<'idle' | 'saving'>('idle');

  const isDark = theme === 'dark';
  const bg = isDark ? '#080808' : '#fafafa';
  const bgRaised = isDark ? '#0f0f0f' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#efefef';
  const textPrimary = isDark ? '#f2f2f2' : '#0a0a0a';
  const textMuted = isDark ? '#666' : '#737373';
  const green = isDark ? '#00ff88' : '#00a86b';

  useEffect(() => {
    if (role !== 'CREATOR') return;

    let cancelled = false;
    async function fetchCreatorPosts() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/me/posts', { cache: 'no-store' });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Unable to load analytics.');
        }

        const data = await response.json();
        if (!cancelled) {
          setPosts((data.posts || []).map(toPostAnalytics));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchCreatorPosts();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const scoreHistory = useMemo(() => buildScoreHistory(posts, range), [posts, range]);

  const handleBecomeCreator = async () => {
    setRoleStatus('saving');
    setError(null);

    try {
      const response = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'CREATOR' }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to update account role.');
      }

      const data = await response.json();
      syncAuthenticatedUser(data.user, data.onboardingComplete);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update account role.');
    } finally {
      setRoleStatus('idle');
    }
  };

  if (role !== 'CREATOR') {
    return (
      <div className="app-page" style={{ backgroundColor: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <BarChartIcon size={40} color={isDark ? '#333' : '#ccc'} />
          <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 16, fontWeight: 700, color: textPrimary, margin: '16px 0 8px' }}>
            Creator analytics
          </p>
          <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, color: textMuted, margin: '0 0 24px' }}>
            Analytics are available for creator accounts.
          </p>
          <button
            onClick={handleBecomeCreator}
            disabled={roleStatus === 'saving'}
            style={{
              padding: '12px 24px',
              backgroundColor: green,
              color: '#000',
              border: 'none',
              fontFamily: 'var(--app-font-sans)',
              fontSize: 13,
              fontWeight: 700,
              cursor: roleStatus === 'saving' ? 'not-allowed' : 'pointer',
              borderRadius: '2px',
            }}
          >
            {roleStatus === 'saving' ? 'Switching...' : 'Switch to Creator'}
          </button>
          {error && (
            <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: '#ef4444', margin: '12px 0 0' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const totalLikes = posts.reduce((s, p) => s + p.likesCount, 0);
  const totalViews = posts.reduce((s, p) => s + p.exposure, 0);
  const avgScore = posts.length > 0
    ? posts.reduce((s, p) => s + p.finalScore, 0) / posts.length
    : 0;

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--app-font-mono)',
    fontSize: 9,
    color: textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    display: 'block',
    marginBottom: 12,
  };

  const scoreBreakdown = [
    { label: 'Quality', value: average(posts, 'qualityScore') },
    { label: 'Relevance', value: average(posts, 'relevanceScore') },
    { label: 'Fairness', value: average(posts, 'fairnessScore') },
  ];

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
          Analytics
        </span>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{
            backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
            border: `1px solid ${border}`,
            color: textPrimary,
            fontFamily: 'var(--app-font-sans)',
            fontSize: 12,
            padding: '6px 10px',
            outline: 'none',
            cursor: 'pointer',
            borderRadius: '2px',
          }}
        >
          {RANGES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="app-content" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="stats-grid" style={{ backgroundColor: border }}>
          {[
            { label: 'TOTAL POSTS', value: posts.length, raw: true },
            { label: 'TOTAL LIKES', value: totalLikes, formatted: formatCount(totalLikes) },
            { label: 'AVG SCORE', value: Math.round(avgScore * 100) / 100, formatted: avgScore.toFixed(2) },
            { label: 'TOTAL VIEWS', value: totalViews, formatted: formatCount(totalViews) },
          ].map(({ label, value, formatted, raw }) => (
            <div key={label} style={{ backgroundColor: bgRaised, padding: '16px 14px' }}>
              <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 28, fontWeight: 700, color: textPrimary, margin: '0 0 2px', lineHeight: 1 }}>
                {raw ? <CountUp value={value as number} /> : <span>{formatted}</span>}
              </p>
              <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {loading && (
          <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: textMuted, textAlign: 'center', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Loading analytics...
          </p>
        )}

        {error && (
          <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: '#ef4444', textAlign: 'center', margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ backgroundColor: bgRaised, border: `1px solid ${border}`, padding: 16 }}>
          <span style={sectionLabel}>Score Breakdown</span>
          {scoreBreakdown.map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: textPrimary }}>{label}</span>
                <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 12, fontWeight: 700, color: green }}>{Math.round(value * 100)}</span>
              </div>
              <div style={{ height: 4, backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${green}, #00c3ff)` }}
                />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <ScoreChart posts={posts} />
          </div>
        </div>

        <div style={{ backgroundColor: bgRaised, border: `1px solid ${border}`, padding: 16 }}>
          <span style={sectionLabel}>Performance Over Time</span>
          <PerformanceChart data={scoreHistory} />
        </div>

        <div style={{ backgroundColor: bgRaised, border: `1px solid ${border}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
            <span style={{ ...sectionLabel, marginBottom: 0 }}>Post Performance</span>
          </div>
          <PostsTable posts={posts} />
        </div>

        <div>
          <span style={{ ...sectionLabel, color: green }}>AI Insights</span>
          <InsightsAccordion posts={posts} />
        </div>
      </div>
    </div>
  );
}

function toPostAnalytics(post: Post): PostAnalytics {
  return {
    postId: post.id,
    caption: post.caption,
    thumbnailUrl: post.contentUrl,
    finalScore: post.finalScore,
    qualityScore: post.qualityScore,
    relevanceScore: post.relevanceScore,
    fairnessScore: post.fairnessScore,
    rankTier: post.rankTier,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    exposure: post.exposure,
    createdAt: post.createdAt,
  };
}

function average(posts: PostAnalytics[], key: 'qualityScore' | 'relevanceScore' | 'fairnessScore') {
  return posts.length > 0 ? posts.reduce((sum, post) => sum + post[key], 0) / posts.length : 0;
}

function buildScoreHistory(posts: PostAnalytics[], range: string): DailyScore[] {
  const days = range === 'Last 7d' ? 7 : range === 'Last 30d' ? 30 : 90;
  const buckets = new Map<string, { total: number; count: number }>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    buckets.set(date.toISOString().slice(5, 10), { total: 0, count: 0 });
  }

  posts.forEach((post) => {
    const key = new Date(post.createdAt).toISOString().slice(5, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.total += post.finalScore;
      bucket.count += 1;
    }
  });

  return [...buckets.entries()].map(([date, bucket]) => ({
    date,
    avgScore: bucket.count > 0 ? bucket.total / bucket.count : 0,
  }));
}

function BarChartIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <rect x="3" y="12" width="4" height="9" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="17" y="3" width="4" height="18" />
    </svg>
  );
}
