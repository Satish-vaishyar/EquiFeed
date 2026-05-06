import { useRef } from 'react';
import type { User } from '../../types';
import { useUserStore } from '../../store/userStore';
import { formatCount } from '../../lib/utils';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onEditClick?: () => void;
  onFollowClick?: () => void;
  onUnfollowClick?: () => void;
}

const INITIALS_COLOR: Record<string, string> = {
  'v0id_arc': '#00ff88',
  'sys.kaito': '#f59e0b',
  'neon_rei': '#ef4444',
  'null.ptr': '#00c3ff',
  'grid_moth': '#a855f7',
  'you_creator': '#00ff88',
};

export function ProfileHeader({ user, isOwnProfile, isFollowing, onEditClick, onFollowClick, onUnfollowClick }: ProfileHeaderProps) {
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === 'dark';
  const accentColor = INITIALS_COLOR[user.username] ?? '#00ff88';

  const bg = isDark ? '#080808' : '#fafafa';
  const bgCard = isDark ? '#0f0f0f' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#efefef';
  const textPrimary = isDark ? '#f2f2f2' : '#0a0a0a';
  const textMuted = isDark ? '#737373' : '#737373';
  const green = isDark ? '#00ff88' : '#00a86b';

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div style={{ backgroundColor: bg }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: isDark ? 'rgba(8,8,8,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span style={{ fontFamily: 'var(--app-font-sans)', fontWeight: 700, fontSize: 15, color: textPrimary }}>
          @{user.username}
        </span>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
          {/* Story ring avatar */}
          <div style={{
            width: 86, height: 86, flexShrink: 0,
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #00ff88 0%, #00c3ff 50%, #a855f7 100%)',
            padding: '2.5px',
          }}>
            <div style={{
              width: '100%', height: '100%',
              borderRadius: '9999px',
              backgroundColor: isDark ? '#080808' : '#fff',
              padding: '2.5px',
            }}>
              <div style={{
                width: '100%', height: '100%',
                borderRadius: '9999px',
                backgroundColor: isDark ? '#111' : '#f5f5f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 22, fontWeight: 700, color: accentColor }}>
                    {initials}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ flex: 1, display: 'flex', gap: 0, paddingTop: 10 }}>
            {[
              { label: 'posts', value: user.postsCount },
              { label: 'followers', value: user.followersCount },
              { label: 'following', value: user.followingCount },
            ].map(({ label, value }, i) => (
              <div key={label} style={{
                flex: 1, textAlign: 'center',
                borderLeft: i > 0 ? `1px solid ${border}` : 'none',
              }}>
                <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 17, fontWeight: 700, color: textPrimary, margin: '0 0 1px' }}>
                  {formatCount(value)}
                </p>
                <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 11, color: textMuted, margin: 0 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Name + role + bio */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 14, fontWeight: 700, color: textPrimary }}>
              {user.displayName}
            </span>
            <span style={{
              fontFamily: 'var(--app-font-mono)',
              fontSize: 9, fontWeight: 700,
              color: green,
              border: `1px solid ${green}`,
              padding: '2px 6px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: '2px',
            }}>
              {user.role}
            </span>
          </div>
          {user.bio && (
            <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, color: textPrimary, margin: '0 0 2px', lineHeight: 1.4 }}>
              {user.bio}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {isOwnProfile ? (
            <>
              <button
                onClick={onEditClick}
                style={{
                  flex: 1, padding: '8px',
                  border: `1px solid ${border}`,
                  backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
                  color: textPrimary,
                  fontFamily: 'var(--app-font-sans)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', borderRadius: '2px',
                }}
              >
                Edit profile
              </button>
              <button
                style={{
                  flex: 1, padding: '8px',
                  border: `1px solid ${border}`,
                  backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
                  color: textPrimary,
                  fontFamily: 'var(--app-font-sans)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', borderRadius: '2px',
                }}
              >
                Share profile
              </button>
            </>
          ) : (
            <button
              onClick={isFollowing ? onUnfollowClick : onFollowClick}
              style={{
                flex: 1, padding: '8px',
                border: isFollowing ? `1px solid ${border}` : 'none',
                background: isFollowing ? (isDark ? '#1a1a1a' : '#f0f0f0') : `linear-gradient(135deg, ${green}, #00c3ff)`,
                color: isFollowing ? textPrimary : '#000',
                fontFamily: 'var(--app-font-sans)',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer', borderRadius: '2px',
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div style={{ height: 1, backgroundColor: border }} />
      </div>
    </div>
  );
}
