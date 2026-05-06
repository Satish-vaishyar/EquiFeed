import { NextResponse } from "next/server";
import { db, commentsTable, postsTable, usersTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { requireCurrentDbUser } from "../../../_lib/users";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  try {
    const comments = await db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          avatarUrl: usersTable.avatarUrl,
        },
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(commentsTable.postId, postId))
      .orderBy(desc(commentsTable.createdAt));

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        text: c.content,
        postId,
        userId: c.user.id,
        user: {
          id: c.user.id,
          username: c.user.username,
          avatarUrl: c.user.avatarUrl ?? undefined,
        },
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const user = await requireCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    const [comment] = await db.transaction(async (tx) => {
      const [newComment] = await tx
        .insert(commentsTable)
        .values({
          postId,
          userId: user.id,
          content: text,
        })
        .returning();

      await tx
        .update(postsTable)
        .set({ commentsCount: sql`${postsTable.commentsCount} + 1` })
        .where(eq(postsTable.id, postId));

      return [newComment];
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        text: comment.content,
        postId,
        userId: user.id,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl ?? undefined,
        },
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
