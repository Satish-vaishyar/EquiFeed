import { NextResponse } from "next/server";
import { requireCurrentDbUser, toAppUser } from "../../_lib/users";
import { db, postsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const dbUser = await requireCurrentDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ post: postsTable, creator: usersTable })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.creatorId, usersTable.id))
    .where(eq(postsTable.creatorId, dbUser.id))
    .orderBy(desc(postsTable.createdAt));

  return NextResponse.json({
    posts: rows.map(({ post, creator }) => ({
      id: post.id,
      creatorId: post.creatorId,
      creator: toAppUser(creator),
      contentUrl: post.contentUrl,
      contentType: post.contentType,
      caption: post.caption ?? undefined,
      hashtags: post.hashtags,
      finalScore: post.finalScore,
      qualityScore: post.qualityScore,
      relevanceScore: post.relevanceScore,
      fairnessScore: post.fairnessScore,
      rankTier: post.rankTier,
      exposure: post.exposure,
      createdAt: post.createdAt.toISOString(),
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      shares: post.shares,
    })),
  });
}
