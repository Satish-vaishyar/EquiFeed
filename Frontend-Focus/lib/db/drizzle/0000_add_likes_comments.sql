CREATE TYPE "public"."equifeed_content_type" AS ENUM('VIDEO', 'IMAGE', 'TEXT');--> statement-breakpoint
CREATE TYPE "public"."equifeed_rank_tier" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."equifeed_role" AS ENUM('CONSUMER', 'CREATOR');--> statement-breakpoint
CREATE TABLE "equifeed_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equifeed_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equifeed_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"cloudinary_public_id" text,
	"content_url" text NOT NULL,
	"content_type" "equifeed_content_type" NOT NULL,
	"caption" text,
	"hashtags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"final_score" real DEFAULT 0 NOT NULL,
	"quality_score" real DEFAULT 0 NOT NULL,
	"relevance_score" real DEFAULT 0 NOT NULL,
	"fairness_score" real DEFAULT 0 NOT NULL,
	"rank_tier" "equifeed_rank_tier" DEFAULT 'LOW' NOT NULL,
	"exposure" integer DEFAULT 0 NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equifeed_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"role" "equifeed_role" DEFAULT 'CONSUMER' NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"posts_count" integer DEFAULT 0 NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"following_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equifeed_comments" ADD CONSTRAINT "equifeed_comments_user_id_equifeed_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."equifeed_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equifeed_comments" ADD CONSTRAINT "equifeed_comments_post_id_equifeed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."equifeed_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equifeed_likes" ADD CONSTRAINT "equifeed_likes_user_id_equifeed_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."equifeed_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equifeed_likes" ADD CONSTRAINT "equifeed_likes_post_id_equifeed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."equifeed_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equifeed_posts" ADD CONSTRAINT "equifeed_posts_creator_id_equifeed_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."equifeed_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "equifeed_likes_user_post_idx" ON "equifeed_likes" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "equifeed_users_clerk_id_idx" ON "equifeed_users" USING btree ("clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "equifeed_users_username_idx" ON "equifeed_users" USING btree ("username");