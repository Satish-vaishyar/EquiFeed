import { NextResponse } from "next/server";
import { db, likesTable, postsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { requireCurrentDbUser } from "../../../_lib/users";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const user = await requireCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if already liked
    const existing = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.postId, postId), eq(likesTable.userId, user.id)))
      .limit(1);

    if (existing.length > 0) {
      // Unlike
      await db.transaction(async (tx) => {
        await tx
          .delete(likesTable)
          .where(and(eq(likesTable.postId, postId), eq(likesTable.userId, user.id)));
        
        await tx
          .update(postsTable)
          .set({ likesCount: sql`${postsTable.likesCount} - 1` })
          .where(eq(postsTable.id, postId));
      });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.transaction(async (tx) => {
        await tx.insert(likesTable).values({
          postId,
          userId: user.id,
        });
        
        await tx
          .update(postsTable)
          .set({ likesCount: sql`${postsTable.likesCount} + 1` })
          .where(eq(postsTable.id, postId));
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}
