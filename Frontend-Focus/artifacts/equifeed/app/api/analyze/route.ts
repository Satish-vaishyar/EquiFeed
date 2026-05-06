import { NextResponse } from "next/server";
import { db, postsTable } from "@workspace/db";
import { count, avg, desc } from "drizzle-orm";

const SCORING_ENGINE_URL =
  process.env.SCORING_ENGINE_URL ?? "http://127.0.0.1:8081";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { post } = body;

    if (!post || !post.id) {
      return NextResponse.json({ error: "Post data is required" }, { status: 400 });
    }

    // Gather system-wide stats required by the AI Python API
    const [statsResult] = await db.select({
      totalPosts: count(),
      avgExposure: avg(postsTable.exposure)
    }).from(postsTable);

    const totalPosts = Number(statsResult.totalPosts || 0);
    const avgExposure = Number(statsResult.avgExposure || 0);

    // Get a sample of trending posts for the AI context
    const trendingPosts = await db.select()
      .from(postsTable)
      .orderBy(desc(postsTable.finalScore))
      .limit(5);

    const trendingSample = trendingPosts.map(p => ({
      title: p.caption?.substring(0, 50) || "Untitled",
      tags: p.hashtags || [],
      engagement: p.likesCount + p.commentsCount + p.shares
    }));

    // Format the payload for the Python AI engine
    const payload = {
      post_id: post.id,
      creator_id: post.creatorId,
      content_text: post.caption || "",
      content_type: post.contentType?.toLowerCase() || "text",
      image_url: post.contentType === "IMAGE" ? post.contentUrl : null,
      video_url: post.contentType === "VIDEO" ? post.contentUrl : null,
      topic_tags: post.hashtags || [],
      created_at: new Date(post.createdAt).toISOString(),
      total_posts_in_system: totalPosts,
      post_current_exposure: post.exposure || 0,
      avg_exposure_all_posts: avgExposure,
      trending_posts_sample: trendingSample
    };

    // Call the local Python AI server
    const aiResponse = await fetch(`${SCORING_ENGINE_URL}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Server Error:", errorText);
      return NextResponse.json({ error: "Failed to fetch AI score" }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    
    // Return the detailed AI response back to the client
    return NextResponse.json(aiData);

  } catch (error) {
    console.error("Error calling AI analysis API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
