import { motion } from 'framer-motion';
import { useParams } from 'wouter';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileGrid } from '../components/profile/ProfileGrid';
import { MOCK_USERS, MOCK_POSTS } from '../data/mockData';
import { useUserStore } from '../store/userStore';

export default function UserProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const followedUsers = useUserStore((s) => s.followedUsers);
  const followUser = useUserStore((s) => s.followUser);
  const unfollowUser = useUserStore((s) => s.unfollowUser);

  const user = MOCK_USERS.find((u) => u.username === username);
  const userPosts = user ? MOCK_POSTS.filter((p) => p.creatorId === user.id) : [];
  const isFollowing = user ? followedUsers.has(user.id) : false;

  if (!user) {
    return (
      <div className="app-page" style={{ backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--app-font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          User not found.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="app-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="app-content">
        <ProfileHeader
          user={{ ...user, isFollowing }}
          isOwnProfile={false}
          isFollowing={isFollowing}
          onFollowClick={() => followUser(user.id)}
          onUnfollowClick={() => unfollowUser(user.id)}
        />
        <ProfileGrid posts={userPosts} />
      </div>
    </motion.div>
  );
}
