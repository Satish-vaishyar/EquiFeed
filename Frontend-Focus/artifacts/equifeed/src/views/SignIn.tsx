import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useSignIn } from '@clerk/nextjs';

export default function SignIn() {
  const [, navigate] = useLocation();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');
        return;
      }

      setError('Clerk needs another verification step for this account.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0f0f0f',
    border: '1px solid #222222',
    color: '#f2f2f2',
    fontFamily: 'var(--app-font-sans)',
    fontSize: 14,
    padding: '12px 14px',
    outline: 'none',
    display: 'block',
    transition: 'border-color 0.2s',
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
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 className="wordmark-gradient" style={{
            fontFamily: 'var(--app-font-sans)',
            fontWeight: 900,
            fontSize: 38,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
            lineHeight: 1,
          }}>
            EquiFeed
          </h1>
          <p style={{
            fontFamily: 'var(--app-font-mono)',
            fontSize: 10,
            color: '#444',
            margin: 0,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Fair visibility. For every creator.
          </p>
        </div>

        {/* Main card */}
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1e1e1e', padding: '28px 24px', marginBottom: 10 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or phone number"
              style={inputStyle}
              required
              onFocus={(e) => (e.target.style.borderColor = '#2a2a2a')}
              onBlur={(e) => (e.target.style.borderColor = '#222')}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={inputStyle}
              required
              onFocus={(e) => (e.target.style.borderColor = '#2a2a2a')}
              onBlur={(e) => (e.target.style.borderColor = '#222')}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#0a2a18' : 'linear-gradient(135deg, #00ff88 0%, #00c3ff 100%)',
                color: loading ? '#00ff88' : '#000',
                border: 'none',
                fontFamily: 'var(--app-font-sans)',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: '#00ff88', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}
            >
              Forgot password?
            </button>
          </div>
          {error && (
            <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: '#ef4444', margin: '12px 0 0', lineHeight: 1.4 }}>
              {error}
            </p>
          )}

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
            <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, fontWeight: 600, color: '#333', letterSpacing: '0.14em' }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
          </div>

          {/* Google SSO */}
          <button
            onClick={handleGoogle}
            disabled={!isLoaded || loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              backgroundColor: '#111',
              border: '1px solid #222',
              color: '#c0c0c0',
              fontFamily: 'var(--app-font-sans)',
              fontSize: 13,
              fontWeight: 500,
              cursor: isLoaded && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sign up link */}
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1e1e1e', padding: '16px 24px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, color: '#555' }}>
            Don't have an account?{' '}
          </span>
          <button
            onClick={() => navigate('/sign-up')}
            style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, fontWeight: 700, color: '#00ff88', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Sign up
          </button>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--app-font-mono)', fontSize: 9, color: '#222', marginTop: 24, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Powered by Clerk Auth
        </p>
      </div>
    </motion.div>
  );
}
