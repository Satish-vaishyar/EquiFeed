import { create } from 'zustand';
import type { Post } from '../types';
import { getRealisticFeedPage, MOCK_POSTS } from '../data/mockData';

interface FeedStore {
  posts: Post[];
  cursor: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  appendPosts: (posts: Post[]) => void;
  setCursor: (c: string | null) => void;
  toggleLike: (postId: string) => void;
  setLoading: (v: boolean) => void;
  initFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  addComment: (postId: string) => void;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: [],
  cursor: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,

  appendPosts: (posts) =>
    set((s) => ({ posts: [...s.posts, ...posts] })),

  setCursor: (c) => set({ cursor: c }),

  toggleLike: async (postId) => {
    // Optimistic update
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      ),
    }));

    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to like");
      const data = await response.json();
      
      // Update with server state if different
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === postId ? { ...p, isLiked: data.liked } : p
        ),
      }));
    } catch (error) {
      // Revert optimistic update
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p
        ),
      }));
    }
  },

  setLoading: (v) => set({ isLoading: v }),

  initFeed: async () => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/posts", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load feed");
      const data = await response.json();
      
      set({ 
        posts: data.posts, 
        cursor: data.nextCursor, 
        hasMore: !!data.nextCursor, 
        isLoading: false 
      });
    } catch {
      set({ 
        posts: [], 
        cursor: null, 
        hasMore: false, 
        isLoading: false 
      });
    }
  },

  loadMore: async () => {
    const { cursor, hasMore, isLoadingMore } = get();
    if (isLoadingMore || !hasMore || !cursor) return;

    set({ isLoadingMore: true });

    try {
      const response = await fetch(`/api/posts?cursor=${encodeURIComponent(cursor)}`);
      if (!response.ok) throw new Error("Failed to load more");
      const data = await response.json();
      
      set((s) => ({
        posts: [...s.posts, ...data.posts],
        cursor: data.nextCursor,
        hasMore: !!data.nextCursor,
        isLoadingMore: false,
      }));
    } catch {
      set({ isLoadingMore: false });
    }
  },

  addComment: (postId) =>
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ),
    })),
}));
