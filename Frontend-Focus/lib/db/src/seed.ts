import { config } from "dotenv";
import { resolve } from "path";
import { eq, like } from "drizzle-orm";

// Load .env.local from the root directory
config({ path: resolve(process.cwd(), "../../.env.local") });

// Import db AFTER environment variables are loaded
const { db, usersTable, postsTable, likesTable, commentsTable } = await import("./index");


const args = process.argv.slice(2);
const isClean = args.includes("--clean");

async function clean() {
  console.log("🧹 Cleaning demo data...");
  try {
    // We only need to delete users whose clerkId starts with 'demo_'
    // Cascading foreign keys will handle the posts, likes, and comments
    await db.delete(usersTable).where(like(usersTable.clerkId, "demo_%"));
    console.log("✅ Demo data removed successfully.");
  } catch (err) {
    console.error("❌ Failed to clean demo data:", err);
  }
}

async function seed() {
  console.log("🌱 Seeding demo data...");
  try {
    // 1. Create demo creators
    const creators = await db.insert(usersTable).values([
      {
        clerkId: "demo_creator_1",
        username: "demo_rider_pro",
        displayName: "Pro Rider",
        role: "CREATOR",
        onboardingComplete: true,
        avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=DRP",
      },
      {
        clerkId: "demo_creator_2",
        username: "demo_horse_lover",
        displayName: "Horse Lover",
        role: "CREATOR",
        onboardingComplete: true,
        avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=DHL",
      }
    ]).returning();

    // 2. Create demo consumers (10 users)
    const consumerData = [];
    for (let i = 1; i <= 10; i++) {
      consumerData.push({
        clerkId: `demo_consumer_${i}`,
        username: `demo_equi_fan_${i}`,
        displayName: `Equi Fan ${i}`,
        role: "CONSUMER",
        onboardingComplete: true,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=DEF${i}`,
      });
    }
    const consumers = await db.insert(usersTable).values(consumerData).returning();

    // 3. Create posts (20 JPG images)
    // We will assign a random number of likes and comments to each post
    const postData = [];
    const postLikesDistribution = []; // Store how many likes each post should have
    const postCommentsDistribution = []; // Store how many comments each post should have

    for (let i = 1; i <= 20; i++) {
      // Analytics volume
      const numLikes = Math.floor(Math.random() * 8); // 0 to 7 likes
      const numComments = Math.floor(Math.random() * 4); // 0 to 3 comments
      
      postLikesDistribution.push(numLikes);
      postCommentsDistribution.push(numComments);

      postData.push({
        creatorId: creators[i % 2 === 0 ? 0 : 1].id,
        // Ensure explicitly requesting a .jpg extension
        contentUrl: `https://picsum.photos/seed/equifeed_horse_${i}/800/800.jpg`,
        contentType: "IMAGE",
        caption: `Equestrian post number ${i} 🐎`,
        hashtags: ["horse", "equestrian", "riding"],
        finalScore: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
        qualityScore: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
        relevanceScore: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
        fairnessScore: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
        rankTier: i % 3 === 0 ? "HIGH" : i % 3 === 1 ? "MEDIUM" : "LOW",
        exposure: Math.floor(Math.random() * 2000),
        likesCount: numLikes,
        commentsCount: numComments,
      });
    }
    
    const posts = await db.insert(postsTable).values(postData).returning();

    // 4. Create likes
    const likesToInsert = [];
    for (let i = 0; i < posts.length; i++) {
      const numLikes = postLikesDistribution[i];
      // Shuffle consumers to pick unique ones for likes
      const shuffledConsumers = [...consumers].sort(() => 0.5 - Math.random());
      for (let j = 0; j < numLikes; j++) {
        likesToInsert.push({
          userId: shuffledConsumers[j].id,
          postId: posts[i].id,
        });
      }
    }
    if (likesToInsert.length > 0) {
      await db.insert(likesTable).values(likesToInsert);
    }

    // 5. Create comments
    const sampleComments = ["Amazing shot! 🐴", "Love this!", "Great post!", "Beautiful!", "Stunning picture.", "Wow, so cool!"];
    const commentsToInsert = [];
    for (let i = 0; i < posts.length; i++) {
      const numComments = postCommentsDistribution[i];
      for (let j = 0; j < numComments; j++) {
        // Pick a random consumer and a random comment text
        const randomConsumer = consumers[Math.floor(Math.random() * consumers.length)];
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        commentsToInsert.push({
          userId: randomConsumer.id,
          postId: posts[i].id,
          content: randomComment,
        });
      }
    }
    if (commentsToInsert.length > 0) {
      await db.insert(commentsTable).values(commentsToInsert);
    }

    console.log("✅ Demo data seeded successfully.");
  } catch (err) {
    console.error("❌ Failed to seed demo data:", err);
  }
}

async function run() {
  if (isClean) {
    await clean();
  } else {
    // Optionally clean before seeding to avoid duplicates
    await clean();
    await seed();
  }
  process.exit(0);
}

run();
