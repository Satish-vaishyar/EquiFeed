import { useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { MOCK_USERS, CURRENT_USER } from '../../data/mockData';

export function StoriesRow() {
  const profile = useUserStore((s) => s.profile) ?? CURRENT_USER;
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === 'dark';
  const [viewed, setViewed] = useState<Set<string>>(new Set());

  const STORY_USERS = [
    { user: profile, label: 'Your story', isOwn: true },
    ...MOCK_USERS.map(u => ({ user: u, label: u.username, isOwn: false }))
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 16,
      padding: '10px 14px',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#efefef'}`,
    }}>
      <style>{`.stories-row::-webkit-scrollbar { display: none; }`}</style>

      {STORY_USERS.map(({ user, label, isOwn }) => {
        const hasViewed = viewed.has(user.id);

        return (
          <button
            key={user.id}
            onClick={() => setViewed((v) => new Set([...v, user.id]))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            {/* Story ring */}
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '9999px',
              background: hasViewed
                ? (isDark ? '#333' : '#c7c7c7')
                : 'linear-gradient(135deg, #00ff88 0%, #00c3ff 50%, #a855f7 100%)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '9999px',
                background: isDark ? '#080808' : '#fff',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: isDark ? '#111' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {isOwn && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 18,
                      height: 18,
                      background: 'linear-gradient(135deg, #00ff88, #00c3ff)',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${isDark ? '#080808' : '#fff'}`,
                    }}>
                      <span style={{ color: '#000', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>+</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <span style={{
              fontFamily: 'var(--app-font-sans)',
              fontSize: 10,
              color: isDark ? '#999' : '#737373',
              maxWidth: 58,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}>
              {isOwn ? 'Your story' : label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
