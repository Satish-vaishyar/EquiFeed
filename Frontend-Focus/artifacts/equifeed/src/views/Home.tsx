import { Moon, Sun } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { FeedContainer } from '../components/feed/FeedContainer';
import { StoriesRow } from '../components/feed/StoriesRow';

export default function Home() {
  const theme = useUserStore((s) => s.theme);
  const toggleTheme = useUserStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <div className="home-shell" style={{ backgroundColor: isDark ? '#000' : 'var(--bg)' }}>
      <div className="home-header" style={{
        backgroundColor: isDark ? 'rgba(8,8,8,0.94)' : 'rgba(255,255,255,0.96)',
        borderBottomColor: isDark ? '#1a1a1a' : 'var(--border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
        }}>
          <h1 className="wordmark-gradient" style={{
            fontFamily: 'var(--app-font-sans)',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: 0,
            margin: 0,
            lineHeight: 1,
          }}>
            EquiFeed
          </h1>

          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{
              background: isDark ? 'none' : 'var(--bg-subtle)',
              border: `1px solid ${isDark ? '#2a2a2a' : 'var(--border)'}`,
              cursor: 'pointer',
              color: isDark ? '#888' : 'var(--green)',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '2px',
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <StoriesRow />
      </div>

      <div style={{ flex: 1 }}>
        <FeedContainer />
      </div>
    </div>
  );
}
