import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_tY7XTlZnEpU3@ep-withered-surf-anfkyp6y-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full"
});

async function run() {
  await client.connect();
  
  try {
    console.log("Creating equifeed_comments...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "equifeed_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    console.log("Creating equifeed_likes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "equifeed_likes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    console.log("Adding foreign keys...");
    try {
      await client.query(`ALTER TABLE "equifeed_comments" ADD CONSTRAINT "equifeed_comments_user_id_equifeed_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."equifeed_users"("id") ON DELETE cascade ON UPDATE no action;`);
    } catch (e) { console.log(e.message); }
    
    try {
      await client.query(`ALTER TABLE "equifeed_comments" ADD CONSTRAINT "equifeed_comments_post_id_equifeed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."equifeed_posts"("id") ON DELETE cascade ON UPDATE no action;`);
    } catch (e) { console.log(e.message); }

    try {
      await client.query(`ALTER TABLE "equifeed_likes" ADD CONSTRAINT "equifeed_likes_user_id_equifeed_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."equifeed_users"("id") ON DELETE cascade ON UPDATE no action;`);
    } catch (e) { console.log(e.message); }

    try {
      await client.query(`ALTER TABLE "equifeed_likes" ADD CONSTRAINT "equifeed_likes_post_id_equifeed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."equifeed_posts"("id") ON DELETE cascade ON UPDATE no action;`);
    } catch (e) { console.log(e.message); }

    try {
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "equifeed_likes_user_post_idx" ON "equifeed_likes" USING btree ("user_id","post_id");`);
    } catch (e) { console.log(e.message); }

    console.log("Done!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
