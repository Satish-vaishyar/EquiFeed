import { motion } from 'framer-motion';
import { Eye, Video } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUserStore } from '../store/userStore';
import type { Role } from '../types';

export default function Onboarding() {
  const [, navigate] = useLocation();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const syncAuthenticatedUser = useUserStore((s) => s.syncAuthenticatedUser);
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (role: Role) => {
    setLoading(true);
    setError(null);
    setSelected(role);

    try {
      const response = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          syncAuthenticatedUser(data.user, data.onboardingComplete);
        } else {
          completeOnboarding(role);
        }
        navigate('/');
        return;
      }

      const data = await response.json().catch(() => ({ error: 'Failed to save profile' }));
      setError(data.error || 'Unable to update role. Please try again.');
    } catch (err) {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100dvh',
        backgroundColor: '#080808',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 className="wordmark-gradient" style={{
            fontFamily: 'var(--app-font-sans)',
            fontWeight: 900,
            fontSize: 32,
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
            lineHeight: 1,
          }}>
            EquiFeed
          </h1>
          <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 16, fontWeight: 700, color: '#f2f2f2', margin: '0 0 4px' }}>
            What brings you here?
          </p>
          <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: '#444', margin: 0, letterSpacing: '0.06em' }}>
            Choose your role — you can change this later.
          </p>
          {error && (
            <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: '#ef4444', marginTop: 16 }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            {
              role: 'CONSUMER' as Role,
              icon: Eye,
              title: 'Consumer',
              desc: 'Discover fair-ranked content from creators you love.',
            },
            {
              role: 'CREATOR' as Role,
              icon: Video,
              title: 'Creator',
              desc: 'Share your work and get ranked on quality, not followers.',
            },
          ] as const).map(({ role, icon: Icon, title, desc }) => (
            <motion.button
              key={role}
              whileTap={loading ? {} : { scale: 0.98 }}
              disabled={loading}
              onClick={() => handleSelect(role)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: 24,
                backgroundColor: selected === role ? '#001a0a' : '#0a0a0a',
                border: `1px solid ${selected === role ? '#00ff88' : '#1e1e1e'}`,
                borderLeft: `3px solid ${selected === role ? '#00ff88' : 'transparent'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                border: `1px solid ${selected === role ? '#00ff88' : '#1e1e1e'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: selected === role ? '#00ff8810' : 'transparent',
              }}>
                <Icon size={22} color={selected === role ? '#00ff88' : '#444'} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 16, fontWeight: 700, color: '#f2f2f2', margin: '0 0 4px' }}>
                  {title}
                </p>
                <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: '#555', margin: 0, lineHeight: 1.4 }}>
                  {desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
