import { motion } from 'framer-motion';
import { Home, Compass, Plus, TrendingUp, BarChart2, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useUserStore } from '../../store/userStore';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/explore', label: 'Explore', icon: Compass },
  { path: '/create', label: 'Create', icon: Plus, creatorOnly: true },
  { path: '/trends', label: 'Trends', icon: TrendingUp },
  { path: '/analytics', label: 'Analytics', icon: BarChart2, creatorOnly: true },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const [location] = useLocation();
  const role = useUserStore((s) => s.role);
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <nav
      className="bottom-nav"
      style={{
        backgroundColor: isDark ? 'rgba(8,8,8,0.95)' : 'rgba(255,255,255,0.95)',
      }}
    >
      <div className="bottom-nav-inner">
        {navItems.map(({ path, label, icon: Icon, creatorOnly }) => {
          const isActive = path === '/' ? location === '/' : location === path;
          const isDisabled = creatorOnly && role !== 'CREATOR';
          const color = isActive
            ? 'var(--green)'
            : isDisabled
              ? isDark ? '#2a2a2a' : '#d4d4d4'
              : isDark ? '#777' : '#737373';

          return (
            <Link key={path} href={isDisabled ? '#' : path}>
              <button
                className="bottom-nav-button"
                style={{
                  cursor: isDisabled ? 'default' : 'pointer',
                  color,
                }}
                title={isDisabled ? 'Creator account required' : label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 22,
                      height: 2,
                      background: 'linear-gradient(90deg, #00ff88, #00c3ff)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}

                {path === '/create' ? (
                  <div style={{
                    width: 32,
                    height: 32,
                    border: `1.5px solid ${isActive ? 'var(--green)' : isDisabled ? (isDark ? '#2a2a2a' : '#d4d4d4') : (isDark ? '#444' : '#c0c0c0')}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? 'var(--green-dim)' : 'none',
                  }}>
                    <Icon size={16} />
                  </div>
                ) : (
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                )}

                <span style={{
                  fontFamily: 'var(--app-font-sans)',
                  fontSize: 8,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: 0,
                }}>
                  {label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
