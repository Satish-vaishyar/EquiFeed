import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useSignUp } from '@clerk/nextjs';

type MissingField = 'username' | 'firstName' | 'lastName' | 'legalAccepted' | string;

export default function SignUp() {
  const [location, navigate] = useLocation();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');

  const inContinueFlow = location === '/sign-up/continue';

  useEffect(() => {
    if (!isSignUpLoaded || !signUp) return;

    if (signUp.status === 'complete' && signUp.createdSessionId && !finalizing) {
      void finalizeSignUp(signUp.createdSessionId);
      return;
    }

    if (!inContinueFlow || signUp.status !== 'missing_requirements') return;

    setPendingVerification(false);
    setMissingFields((signUp.missingFields as MissingField[]) ?? []);

    if (signUp.username) setUsername(signUp.username);
    if (signUp.firstName) setFirstName(signUp.firstName);
    if (signUp.lastName) setLastName(signUp.lastName);
  }, [finalizing, inContinueFlow, isSignUpLoaded, signUp]);

  const needsUsername = useMemo(() => missingFields.includes('username'), [missingFields]);
  const needsFirstName = useMemo(() => missingFields.includes('firstName'), [missingFields]);
  const needsLastName = useMemo(() => missingFields.includes('lastName'), [missingFields]);
  const needsLegalAccepted = useMemo(() => missingFields.includes('legalAccepted'), [missingFields]);

  const finalizeSignUp = async (sessionId: string) => {
    if (finalizing) return;
    setFinalizing(true);
    await setSignUpActive({ session: sessionId });
    navigate('/onboarding');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.create({ emailAddress: email, password, username });

      if (result.status === 'complete' && result.createdSessionId) {
        await finalizeSignUp(result.createdSessionId);
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setError(getClerkError(err, 'Unable to create account.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp || !code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });

      if (result.status === 'complete' && result.createdSessionId) {
        await finalizeSignUp(result.createdSessionId);
        return;
      }

      if (result.status === 'missing_requirements') {
        setMissingFields((result.missingFields as MissingField[]) ?? []);
        navigate('/sign-up/continue');
        return;
      }

      setError('Verification is not complete yet. Check the code and try again.');
    } catch (err) {
      setError(getClerkError(err, 'Unable to verify email.'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinueSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      const updates: Record<string, string | boolean> = {};
      if (needsUsername) updates.username = username.trim();
      if (needsFirstName) updates.firstName = firstName.trim();
      if (needsLastName) updates.lastName = lastName.trim();
      if (needsLegalAccepted) updates.legalAccepted = true;

      const updated = await signUp.update(updates as any);

      if (updated.status === 'complete' && updated.createdSessionId) {
        await finalizeSignUp(updated.createdSessionId);
        return;
      }

      if (updated.status === 'missing_requirements') {
        setMissingFields((updated.missingFields as MissingField[]) ?? []);
        setError('A few required details are still missing.');
        return;
      }

      setError('Could not complete sign-up. Please try again.');
    } catch (err) {
      setError(getClerkError(err, 'Unable to complete sign-up.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isSignUpLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/onboarding`,
        continueSignUp: true,
      });
    } catch (err) {
      setError(getClerkError(err, 'Unable to sign up with Google.'));
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

        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1e1e1e', padding: '28px 24px', marginBottom: 10 }}>
          {inContinueFlow ? (
            <form onSubmit={handleContinueSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, color: '#888', margin: '0 0 4px', lineHeight: 1.5 }}>
                Finish your signup details to continue.
              </p>
              {needsUsername && (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  style={inputStyle}
                  required
                  onFocus={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  onBlur={(e) => (e.target.style.borderColor = '#222')}
                />
              )}
              {needsFirstName && (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  style={inputStyle}
                  required
                  onFocus={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  onBlur={(e) => (e.target.style.borderColor = '#222')}
                />
              )}
              {needsLastName && (
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  style={inputStyle}
                  required
                  onFocus={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  onBlur={(e) => (e.target.style.borderColor = '#222')}
                />
              )}
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
                }}
              >
                {loading ? 'Finishing...' : 'Continue'}
              </button>
            </form>
          ) : pendingVerification ? (
            <form onSubmit={handleVerification} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, color: '#888', margin: '0 0 4px', lineHeight: 1.5 }}>
                Enter the verification code sent to {email}.
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Verification code"
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
                }}
              >
                {loading ? 'Verifying...' : 'Verify email'}
              </button>
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                disabled={loading}
                style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: '#00ff88', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', padding: 0 }}
              >
                Edit signup details
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={inputStyle}
                required
                onFocus={(e) => (e.target.style.borderColor = '#2a2a2a')}
                onBlur={(e) => (e.target.style.borderColor = '#222')}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
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
                }}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
            <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, fontWeight: 600, color: '#333', letterSpacing: '0.14em' }}>OR</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
          </div>
          {error && (
            <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: '#ef4444', margin: '0 0 12px', lineHeight: 1.4 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleGoogle}
            disabled={!isSignUpLoaded || loading || pendingVerification || inContinueFlow}
            style={{
              width: '100%',
              padding: '11px 16px',
              backgroundColor: '#111',
              border: '1px solid #222',
              color: '#c0c0c0',
              fontFamily: 'var(--app-font-sans)',
              fontSize: 13,
              fontWeight: 500,
              cursor: isSignUpLoaded && !loading && !pendingVerification && !inContinueFlow ? 'pointer' : 'not-allowed',
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

        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1e1e1e', padding: '16px 24px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, color: '#555' }}>
            Have an account?{' '}
          </span>
          <button
            onClick={() => navigate('/sign-in')}
            style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, fontWeight: 700, color: '#00ff88', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Log in
          </button>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--app-font-mono)', fontSize: 9, color: '#222', marginTop: 24, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Powered by Clerk Auth
        </p>
      </div>
    </motion.div>
  );
}

function getClerkError(error: unknown, fallback: string) {
  const clerkError = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
  return clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.message || fallback;
}
