import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useUserStore } from '../store/userStore';
import { UploadArea } from '../components/create/UploadArea';
import { TagInput } from '../components/shared/TagInput';

const CONTENT_TYPES = ['Video', 'Image', 'Text'] as const;
type ContentTypeOption = typeof CONTENT_TYPES[number];

export default function Create() {
  const [, navigate] = useLocation();
  const role = useUserStore((s) => s.role);
  const syncAuthenticatedUser = useUserStore((s) => s.syncAuthenticatedUser);
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [contentType, setContentType] = useState<ContentTypeOption>('Image');
  const [_file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [roleStatus, setRoleStatus] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);

  const bg = isDark ? '#080808' : '#fafafa';
  const bgCard = isDark ? '#0f0f0f' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#efefef';
  const textPrimary = isDark ? '#f2f2f2' : '#0a0a0a';
  const textMuted = isDark ? '#666' : '#737373';
  const green = isDark ? '#00ff88' : '#00a86b';

  const isValid = caption.trim().length > 0 && _file !== null;

  const handleFileSelect = (file: File, _url: string, type: 'VIDEO' | 'IMAGE') => {
    setFile(file);
    setContentType(type === 'VIDEO' ? 'Video' : 'Image');
  };

  const handlePost = async () => {
    if (!isValid) return;
    setStatus('uploading');
    setProgress(20);
    setError(null);

    const formData = new FormData();
    formData.append('file', _file);
    formData.append('caption', caption);
    formData.append('hashtags', JSON.stringify(hashtags));

    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Unable to upload post.');
      setStatus('idle');
      setProgress(0);
      return;
    }

    setProgress(100);
    setStatus('done');
    setTimeout(() => navigate('/profile'), 1500);
  };

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
      <div className="app-page" style={{
        backgroundColor: bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 16, fontWeight: 700, color: textPrimary, margin: '0 0 8px' }}>
            Creator-only feature
          </p>
          <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 13, color: textMuted, margin: '0 0 24px' }}>
            Switch to a creator account to upload content.
          </p>
          <button
            onClick={handleBecomeCreator}
            disabled={roleStatus === 'saving'}
            style={{
              padding: '12px 28px',
              background: `linear-gradient(135deg, ${green}, #00c3ff)`,
              color: '#000', border: 'none',
              fontFamily: 'var(--app-font-sans)',
              fontSize: 14, fontWeight: 700,
              cursor: roleStatus === 'saving' ? 'not-allowed' : 'pointer', borderRadius: '2px',
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

  return (
    <div className="app-page" style={{ backgroundColor: bg }}>
      {/* Top bar */}
      <div className="app-topbar" style={{
        position: 'sticky', top: 0, zIndex: 20,
        backgroundColor: isDark ? 'rgba(8,8,8,0.95)' : 'rgba(255,255,255,0.95)',
        borderBottom: `1px solid ${border}`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate(-1 as any)}
          style={{ color: textMuted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
        >
          <ChevronLeft size={20} />
          <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 14, color: textMuted }}>Back</span>
        </button>
        <span style={{ fontFamily: 'var(--app-font-sans)', fontWeight: 700, fontSize: 15, color: textPrimary }}>
          New Post
        </span>
        <button
          onClick={handlePost}
          disabled={!isValid || status !== 'idle'}
          style={{
            padding: '7px 18px',
            background: isValid && status === 'idle' ? `linear-gradient(135deg, ${green}, #00c3ff)` : (isDark ? '#1a1a1a' : '#e0e0e0'),
            color: isValid && status === 'idle' ? '#000' : textMuted,
            border: 'none',
            fontFamily: 'var(--app-font-sans)',
            fontSize: 13, fontWeight: 700,
            cursor: isValid && status === 'idle' ? 'pointer' : 'not-allowed',
            borderRadius: '2px',
          }}
        >
          Post
        </button>
      </div>

      <div className="mobile-content" style={{ padding: '16px' }}>
        <UploadArea onFileSelect={handleFileSelect} />

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Caption */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
              rows={3}
              placeholder="Write a caption..."
              style={{
                width: '100%',
                backgroundColor: isDark ? '#0f0f0f' : '#fff',
                border: `1px solid ${border}`,
                color: textPrimary,
                fontFamily: 'var(--app-font-sans)',
                fontSize: 14,
                padding: '12px 14px',
                outline: 'none',
                resize: 'none',
                borderRadius: '2px',
              }}
            />
            <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: textMuted, margin: '4px 0 0', textAlign: 'right' }}>
              {caption.length}/2200
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <label style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              Hashtags
            </label>
            <TagInput tags={hashtags} onChange={setHashtags} />
          </div>

          {/* Content Type toggle buttons */}
          <div>
            <label style={{ fontFamily: 'var(--app-font-mono)', fontSize: 9, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
              Content Type
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  style={{
                    flex: 1, padding: '10px 6px',
                    backgroundColor: contentType === type ? (isDark ? '#001a0a' : '#e6f9f0') : (isDark ? '#0f0f0f' : '#fff'),
                    border: `1px solid ${contentType === type ? green : border}`,
                    color: contentType === type ? green : textMuted,
                    fontFamily: 'var(--app-font-sans)',
                    fontSize: 13, fontWeight: contentType === type ? 700 : 400,
                    cursor: 'pointer', borderRadius: '2px',
                    transition: 'all 0.15s',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Upload progress */}
          {status === 'uploading' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Uploading & scoring...
                </span>
                <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: green }}>{progress}%</span>
              </div>
              <div style={{ height: 3, backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0', overflow: 'hidden', borderRadius: '2px' }}>
                <motion.div
                  animate={{ width: `${progress}%` }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${green}, #00c3ff)` }}
                />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div style={{
              padding: '14px 16px',
              border: `1px solid ${green}`,
              backgroundColor: isDark ? '#001a0a' : '#e6f9f0',
              display: 'flex', flexDirection: 'column', gap: 4,
              borderRadius: '2px',
            }}>
              <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 14, color: green, fontWeight: 700 }}>✓ Posted successfully</span>
              <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: textMuted }}>
                Your content is being scored in the background...
              </span>
            </div>
          )}
          {error && status === 'idle' && (
            <p style={{ fontFamily: 'var(--app-font-sans)', fontSize: 12, color: '#ef4444', margin: 0 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
