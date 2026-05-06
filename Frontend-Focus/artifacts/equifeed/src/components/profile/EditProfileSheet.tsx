import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

export function EditProfileSheet({ open, onClose }: EditProfileSheetProps) {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!profile) return;
    setSaving(true);
    setTimeout(() => {
      setProfile({ ...profile, displayName, bio });
      setSaving(false);
      onClose();
    }, 800);
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--app-font-mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--app-font-mono)',
    fontSize: 13,
    padding: '10px 12px',
    outline: 'none',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 300 }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80vh',
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              zIndex: 301,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--app-font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Edit Profile
              </span>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={inputStyle}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'var(--app-font-sans)', fontSize: 13 }}
                  placeholder="Tell the world about yourself..."
                />
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: saving ? 'var(--bg-subtle)' : 'var(--green)',
                  color: saving ? 'var(--text-muted)' : '#000',
                  border: 'none',
                  fontFamily: 'var(--app-font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
