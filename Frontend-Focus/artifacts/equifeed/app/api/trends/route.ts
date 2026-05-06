import { NextResponse } from "next/server";
import { db, postsTable, usersTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";

type TrendsPayload = {
  topPosts: Array<{
    id: string;
    creatorId: string;
    creator: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string;
      role: "CONSUMER" | "CREATOR";
    };
    contentUrl: string;
    contentType: "VIDEO" | "IMAGE" | "TEXT";
    caption?: string;
    hashtags: string[];
    finalScore: number;
    qualityScore: number;
    relevanceScore: number;
    fairnessScore: number;
    rankTier: "HIGH" | "MEDIUM" | "LOW";
    exposure: number;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
    shares: number;
    isLiked: boolean;
  }>;
  topics: Array<{ name: string; postCount: number; aggregateScore: number; trend: "up" | "stable" | "down" }>;
  hashtags: Array<{ tag: string; postCount: number; aggregateScore: number }>;
};

const emptyPayload: TrendsPayload = { topPosts: [], topics: [], hashtags: [] };
let cachedPayload: TrendsPayload | null = null;

export async function GET() {
  try {
    const rows = await withTimeout(db
      .select({ post: postsTable, creator: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.creatorId, usersTable.id))
      .orderBy(
        desc(
          sql<number>`(${postsTable.finalScore} * 0.7) + (LEAST(${postsTable.likesCount} + ${postsTable.commentsCount} + ${postsTable.shares}, 500)::float / 500 * 0.3)`,
        ),
      )
      .limit(30), 3500);

    const topPosts = rows.map(r => r.post);
    const creatorsById = Object.fromEntries(rows.map(r => [r.post.id, r.creator]));

    const scoredPosts = topPosts.map((post) => {
      const creator = creatorsById[post.id];

      return {
        id: post.id,
        creatorId: post.creatorId,
        creator: {
          id: creator.id,
          username: creator.username,
          displayName: creator.displayName,
          avatarUrl: creator.avatarUrl ?? undefined,
          role: creator.role,
        },
        contentUrl: post.contentUrl,
        contentType: post.contentType,
        caption: post.caption ?? undefined,
        hashtags: post.hashtags,
        finalScore: post.finalScore ?? 0,
        qualityScore: post.qualityScore ?? 0,
        relevanceScore: post.relevanceScore ?? 0,
        fairnessScore: post.fairnessScore ?? 0,
        rankTier: post.rankTier,
        exposure: post.exposure,
        createdAt: post.createdAt.toISOString(),
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        shares: post.shares,
        isLiked: false,
      };
    });

    scoredPosts.sort((a, b) => b.finalScore - a.finalScore);

    const topicMap: Record<string, { count: number; score: number }> = {};
    const hashtagMap: Record<string, { count: number; score: number }> = {};

    topPosts.forEach((post) => {
      const scoreForAgg = post.finalScore ?? 0;
      const postHashtags: string[] = post.hashtags || [];
      const topicSources = postHashtags.map(h => h.replace(/^#/, "").toLowerCase()).filter(Boolean);

      topicSources.forEach((t: string) => {
        const key = t.toLowerCase();
        if (!topicMap[key]) topicMap[key] = { count: 0, score: 0 };
        topicMap[key].count++;
        topicMap[key].score += scoreForAgg;
      });

      postHashtags.forEach((h: string) => {
        const cleanH = h.replace(/^#/, "");
        if (!cleanH) return;
        if (!hashtagMap[cleanH]) hashtagMap[cleanH] = { count: 0, score: 0 };
        hashtagMap[cleanH].count++;
        hashtagMap[cleanH].score += scoreForAgg;
      });
    });

    const topics = Object.entries(topicMap)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        postCount: data.count,
        aggregateScore: data.count > 0 ? data.score / data.count : 0,
        trend: (data.count > 2 ? "up" : "stable") as "up" | "stable" | "down",
      }))
      .sort((a, b) => b.postCount - a.postCount || b.aggregateScore - a.aggregateScore)
      .slice(0, 10);

    const hashtags = Object.entries(hashtagMap)
      .map(([tag, data]) => ({
        tag: `#${tag}`,
        postCount: data.count,
        aggregateScore: data.count > 0 ? data.score / data.count : 0,
      }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 15);

    const payload = { topPosts: scoredPosts, topics, hashtags };
    cachedPayload = payload;

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(cachedPayload ?? emptyPayload);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Trends query timed out")), ms);
    }),
  ]);
}
