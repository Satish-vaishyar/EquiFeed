import type { Comment, DailyScore, Post, PostAnalytics, TrendingHashtag, TrendingTopic, User } from '../types';

export const MOCK_USERS: User[] = [];

export const CURRENT_USER: User = {
  id: 'u_me',
  clerkId: 'clerk_me',
  username: 'you',
  displayName: 'Your Profile',
  bio: 'Photos, notes, and moments worth keeping.',
  avatarUrl: 'https://i.pravatar.cc/160?img=68',
  role: 'CREATOR',
  createdAt: '2024-05-01T10:00:00Z',
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
};

export function getRealisticFeedPage(page = 0, pageSize = 6): Post[] {
  return [];
}

export const MOCK_POSTS: Post[] = [];
export const MOCK_MY_POSTS: Post[] = [];
export const MOCK_COMMENTS: Comment[] = [];
export const TRENDING_TOPICS: TrendingTopic[] = [];
export const TRENDING_HASHTAGS: TrendingHashtag[] = [];
export const SCORE_HISTORY: DailyScore[] = [];
export const MY_POST_ANALYTICS: PostAnalytics[] = [];
