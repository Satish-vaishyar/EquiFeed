import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useClerk } from '@clerk/nextjs';
import { useUserStore } from '../store/userStore';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileGrid } from '../components/profile/ProfileGrid';
import { EditProfileSheet } from '../components/profile/EditProfileSheet';
import { CURRENT_USER } from '../data/mockData';
import { Sun, Moon, Loader2 } from 'lucide-react';
import type { Post } from '../types';

export default function Profile() {
  const { signOut: clerkSignOut } = useClerk();
  const profile = useUserStore((s) => s.profile) ?? CURRENT_USER;
  const signOut = useUserStore((s) => s.signOut);
  const theme = useUserStore((s) => s.theme);
  const toggleTheme = useUserStore((s) => s.toggleTheme);
  const [editOpen, setEditOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch profile posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="app-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ backgroundColor: isDark ? '#080808' : '#fafafa' }}
    >
      <div className="app-content">
        <ProfileHeader
          user={profile}
          isOwnProfile
          onEditClick={() => setEditOpen(true)}
        />
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : (
          <ProfileGrid posts={posts} />
        )}

        {/* Settings row */}
        <div style={{
          margin: '24px 16px 0',
          display: 'flex', flexDirection: 'column', gap: 1,
          border: `1px solid ${isDark ? '#1f1f1f' : '#efefef'}`,
        }}>
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              background: isDark ? '#0f0f0f' : '#fff',
              border: 'none',
              borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#efefef'}`,
              cursor: 'pointer', color: isDark ? '#f2f2f2' : '#0a0a0a',
            }}
          >
            <span style={{ fontFamily: 'var(--app-font-sans)', fontSize: 14 }}>
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </span>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => {
              void clerkSignOut().finally(() => signOut());
            }}
            style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px',
              background: isDark ? '#0f0f0f' : '#fff',
              border: 'none', cursor: 'pointer',
              color: '#ef4444', fontFamily: 'var(--app-font-sans)', fontSize: 14,
              textAlign: 'left',
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} />
    </motion.div>
  );
}
