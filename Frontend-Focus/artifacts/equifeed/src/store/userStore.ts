import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types';
import { CURRENT_USER } from '../data/mockData';

type Theme = 'dark' | 'light';

interface UserStore {
  profile: User | null;
  role: Role;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  theme: Theme;
  setProfile: (p: User) => void;
  syncAuthenticatedUser: (profile: User, onboardingComplete: boolean) => void;
  setRole: (r: Role) => void;
  signIn: () => void;
  signOut: () => void;
  completeOnboarding: (role: Role) => void;
  toggleTheme: () => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  followedUsers: Set<string>;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      role: 'CONSUMER',
      isAuthenticated: false,
      onboardingComplete: false,
      theme: 'dark',
      followedUsers: new Set<string>(),

      setProfile: (p) => set({ profile: p }),
      syncAuthenticatedUser: (profile, onboardingComplete) =>
        set({
          profile,
          role: profile.role,
          isAuthenticated: true,
          onboardingComplete,
        }),
      setRole: (r) => set((s) => ({
        role: r,
        profile: s.profile ? { ...s.profile, role: r } : s.profile,
      })),
      signIn: () => set({
        profile: CURRENT_USER,
        role: CURRENT_USER.role,
        isAuthenticated: true,
      }),
      signOut: () => set({
        profile: null,
        isAuthenticated: false,
        onboardingComplete: false,
        followedUsers: new Set<string>(),
      }),
      completeOnboarding: (role: Role) =>
        set((s) => ({
          role,
          onboardingComplete: true,
          profile: s.profile ? { ...s.profile, role } : { ...CURRENT_USER, role },
          isAuthenticated: true,
        })),
      toggleTheme: () =>
        set((s) => {
          const next: Theme = s.theme === 'dark' ? 'light' : 'dark';
          applyTheme(next);
          return { theme: next };
        }),
      followUser: (userId: string) =>
        set((s) => ({
          followedUsers: new Set([...s.followedUsers, userId]),
        })),
      unfollowUser: (userId: string) =>
        set((s) => {
          const next = new Set(s.followedUsers);
          next.delete(userId);
          return { followedUsers: next };
        }),
    }),
    {
      name: 'equifeed-user',
      partialize: (s) => ({
        profile: s.profile,
        role: s.role,
        isAuthenticated: s.isAuthenticated,
        onboardingComplete: s.onboardingComplete,
        theme: s.theme,
        followedUsers: [...s.followedUsers],
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<UserStore> & { followedUsers?: string[] };
        const theme = (p.theme ?? 'dark') as Theme;
        applyTheme(theme);
        return {
          ...current,
          ...p,
          theme,
          followedUsers: new Set<string>(p.followedUsers ?? []),
        };
      },
    }
  )
);
