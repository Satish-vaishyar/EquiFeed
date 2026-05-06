import { NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { db, postsTable, usersTable, likesTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { requireCurrentDbUser } from "../_lib/users";
import type { ContentType } from "../../../src/types";

const SCORING_ENGINE_URL =
  process.env.SCORING_ENGINE_URL ?? "http://35.244.13.244/";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/", "video/"]);

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_URL) ||
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function parseHashtags(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const currentUser = await requireCurrentDbUser();

  const query = db
    .select({
      post: postsTable,
      creator: usersTable,
      isLiked: currentUser 
        ? sql<boolean>`EXISTS (SELECT 1 FROM ${likesTable} WHERE ${likesTable.postId} = ${postsTable.id} AND ${likesTable.userId} = ${currentUser.id})`
        : sql<boolean>`false`,
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.creatorId, usersTable.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit);

  if (cursor) {
    query.where(sql`${postsTable.createdAt} < ${cursor}`);
  }

  const rows = await query;

  return NextResponse.json({
    posts: rows.map(({ post, creator, isLiked }) => ({
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
      isLiked,
    })),
    nextCursor: rows.length === limit ? rows[rows.length - 1].post.createdAt.toISOString() : null,
  });
}

async function uploadToCloudinary(file: File, contentType: Exclude<ContentType, "TEXT">) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const resourceType = contentType === "VIDEO" ? "video" : "image";

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "equifeed",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary did not return an upload result"));
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentDbUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "CREATOR") {
      return NextResponse.json({ error: "Creator account required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A media file is required" }, { status: 400 });
    }

    if (![...allowedTypes].some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json({ error: "Only image and video uploads are supported" }, { status: 400 });
    }

    if (!hasCloudinaryConfig) {
      return NextResponse.json(
        { error: "Upload service is not configured. Add CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET." },
        { status: 500 },
      );
    }

    const contentType: Exclude<ContentType, "TEXT"> = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
    const caption = String(formData.get("caption") ?? "").trim();
    const hashtags = parseHashtags(formData.get("hashtags"));
    const uploaded = await uploadToCloudinary(file, contentType);

    const [post] = await db
      .insert(postsTable)
      .values({
        creatorId: user.id,
        cloudinaryPublicId: uploaded.public_id,
        contentUrl: uploaded.secure_url,
        contentType,
        caption: caption || null,
        hashtags,
        finalScore: 0.5,
        qualityScore: 0.5,
        relevanceScore: 0.5,
        fairnessScore: 0.5,
        rankTier: "MEDIUM",
      })
      .returning();

    await db
      .update(usersTable)
      .set({ postsCount: sql`${usersTable.postsCount} + 1`, updatedAt: sql`now()` })
      .where(sql`${usersTable.id} = ${user.id}`);

    // Fire-and-forget: score the post in the background and persist results
    ;(async () => {
      try {
        const [stats] = await db
          .select({ totalPosts: sql<number>`count(*)`, avgExposure: sql<number>`avg(exposure)` })
          .from(postsTable);

        const trendingSample = await db
          .select()
          .from(postsTable)
          .orderBy(desc(postsTable.finalScore))
          .limit(5)
          .then(rows => rows.map(p => ({
            title: p.caption?.substring(0, 50) || "Untitled",
            tags: p.hashtags || [],
            engagement: p.likesCount + p.commentsCount + p.shares,
          })));

        const payload = {
          post_id: post.id,
          creator_id: post.creatorId,
          content_text: post.caption || "",
          content_type: post.contentType?.toLowerCase() || "image",
          image_url: post.contentType === "IMAGE" ? post.contentUrl : null,
          video_url: post.contentType === "VIDEO" ? post.contentUrl : null,
          topic_tags: post.hashtags || [],
          created_at: post.createdAt.toISOString(),
          total_posts_in_system: Number(stats?.totalPosts ?? 1),
          post_current_exposure: post.exposure ?? 0,
          avg_exposure_all_posts: Number(stats?.avgExposure ?? 0),
          trending_posts_sample: trendingSample,
        };

        const res = await fetch(`${SCORING_ENGINE_URL}/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
          const scored = await res.json();
          const tier = (scored.rank_tier as string)?.toUpperCase();
          const validTier = tier === "HIGH" || tier === "MEDIUM" ? tier : "LOW";
          await db
            .update(postsTable)
            .set({
              finalScore: scored.final_score ?? post.finalScore,
              qualityScore: scored.scores?.content_quality?.score ?? post.qualityScore,
              relevanceScore: scored.scores?.relevance?.score ?? post.relevanceScore,
              fairnessScore: scored.scores?.fairness?.score ?? post.fairnessScore,
              rankTier: validTier as "HIGH" | "MEDIUM" | "LOW",
              updatedAt: new Date(),
            })
            .where(eq(postsTable.id, post.id));
        }
      } catch {
        // Scoring is best-effort; do not crash the response
      }
    })();

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    const message =
      error?.message ||
      error?.error?.message ||
      "Unexpected upload error";

    if (message.toLowerCase().includes("cloudinary")) {
      return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 502 });
    }

    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
