import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("equifeed_role", ["CONSUMER", "CREATOR"]);
export const contentTypeEnum = pgEnum("equifeed_content_type", ["VIDEO", "IMAGE", "TEXT"]);
export const rankTierEnum = pgEnum("equifeed_rank_tier", ["HIGH", "MEDIUM", "LOW"]);

export const usersTable = pgTable(
  "equifeed_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull(),
    email: text("email"),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    role: roleEnum("role").notNull().default("CONSUMER"),
    onboardingComplete: boolean("onboarding_complete").notNull().default(false),
    postsCount: integer("posts_count").notNull().default(0),
    followersCount: integer("followers_count").notNull().default(0),
    followingCount: integer("following_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clerkIdIdx: uniqueIndex("equifeed_users_clerk_id_idx").on(table.clerkId),
    usernameIdx: uniqueIndex("equifeed_users_username_idx").on(table.username),
  }),
);

export const postsTable = pgTable("equifeed_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  cloudinaryPublicId: text("cloudinary_public_id"),
  contentUrl: text("content_url").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  caption: text("caption"),
  hashtags: jsonb("hashtags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  finalScore: real("final_score").notNull().default(0),
  qualityScore: real("quality_score").notNull().default(0),
  relevanceScore: real("relevance_score").notNull().default(0),
  fairnessScore: real("fairness_score").notNull().default(0),
  rankTier: rankTierEnum("rank_tier").notNull().default("LOW"),
  exposure: integer("exposure").notNull().default(0),
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const likesTable = pgTable(
  "equifeed_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userPostUnique: uniqueIndex("equifeed_likes_user_post_idx").on(table.userId, table.postId),
  }),
);

export const commentsTable = pgTable("equifeed_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  postId: uuid("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DbUser = typeof usersTable.$inferSelect;
export type DbPost = typeof postsTable.$inferSelect;
export type DbLike = typeof likesTable.$inferSelect;
export type DbComment = typeof commentsTable.$inferSelect;
