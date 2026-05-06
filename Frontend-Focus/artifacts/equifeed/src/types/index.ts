export type Role = 'CONSUMER' | 'CREATOR';
export type ContentType = 'VIDEO' | 'IMAGE' | 'TEXT';
export type RankTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id: string;
  clerkId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  role: Role;
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  creatorId: string;
  creator: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'role'>;
  contentUrl: string;
  contentType: ContentType;
  caption?: string;
  hashtags: string[];
  finalScore: number;
  qualityScore: number;
  relevanceScore: number;
  fairnessScore: number;
  rankTier: RankTier;
  exposure: number;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  shares: number;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  text: string;
  user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  createdAt: string;
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

export interface TrendingTopic {
  name: string;
  postCount: number;
  aggregateScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendingHashtag {
  tag: string;
  postCount: number;
  aggregateScore: number;
}

export interface TrendResponse {
  topPosts: Post[];
  topics: TrendingTopic[];
  hashtags: TrendingHashtag[];
}

export interface DailyScore {
  date: string;
  avgScore: number;
}

export interface PostAnalytics {
  postId: string;
  caption?: string;
  thumbnailUrl: string;
  finalScore: number;
  qualityScore: number;
  relevanceScore: number;
  fairnessScore: number;
  rankTier: RankTier;
  likesCount: number;
  commentsCount: number;
  exposure: number;
  createdAt: string;
  feedback?: string;
}

export interface AnalyticsResponse {
  totalPosts: number;
  totalLikes: number;
  avgScore: number;
  totalViews: number;
  scoreHistory: DailyScore[];
  posts: PostAnalytics[];
}

export interface ScoreResponse {
  qualityScore: number;
  relevanceScore: number;
  fairnessScore: number;
  finalScore: number;
  rankTier: RankTier;
  feedback?: string;
}

export interface UserProfile extends User {
  posts: Post[];
}
