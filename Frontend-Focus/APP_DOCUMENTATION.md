# EquiFeed Application Documentation

## 1. Overview

EquiFeed is a mobile-first social content application focused on fair content visibility. The product presents a creator feed where posts are ranked by quality, relevance, and fairness scores instead of follower count alone.

The application supports two user roles:

- `CONSUMER`: discovers and interacts with ranked content.
- `CREATOR`: uploads media, views creator analytics, and manages profile content.

The current implementation is a hybrid prototype and functional app:

- Authentication, user syncing, role onboarding, database-backed users, database-backed feed loading, and Cloudinary media upload are implemented.
- Explore, trends, analytics, profile galleries, comments, stories, and sample scoring data mostly use local mock data.

## 2. Repository Structure

```text
Frontend-Focus/
  artifacts/
    equifeed/              Main Next.js EquiFeed application
    api-server/            Minimal standalone API server artifact
    mockup-sandbox/        Vite-based UI mockup sandbox
  lib/
    db/                    Drizzle/Postgres schema and database client
    api-client-react/      Generated React API client package
    api-zod/               Generated Zod API schemas
    api-spec/              OpenAPI specification and generator config
  scripts/                 Workspace utility scripts
  package.json             Root workspace scripts
  pnpm-workspace.yaml      pnpm workspace and shared dependency catalog
  .env.example             Required environment variable template
```

The main product lives in `artifacts/equifeed`.

## 3. Technology Stack

- Framework: Next.js 15 with React 19.
- Routing: Next App Router shell plus Wouter for client-side routes.
- Auth: Clerk with email/password and Google OAuth flows.
- State: Zustand with local persistence for user/session-adjacent UI state.
- Data fetching: native `fetch`, plus React Query provider available at app root.
- Database: PostgreSQL through Drizzle ORM and `node-postgres`.
- Media storage: Cloudinary for uploaded images and videos.
- UI: custom mobile-first React components, Radix UI primitives, Lucide icons, Framer Motion, Recharts.
- Styling: global CSS variables plus mostly inline component styles.
- Package manager: pnpm workspace.

## 4. Main App Entry Points

### Next Layout

File: `artifacts/equifeed/app/layout.tsx`

The root layout wraps the app with `ClerkProvider`, configures auth redirect URLs, imports global CSS, and sets metadata:

- App title: `EquiFeed`
- Icon: `/favicon.svg`
- Sign-in path: `/sign-in`
- Sign-up path: `/sign-up`
- Sign-up completion redirect: `/onboarding`

### Catch-All Page

File: `artifacts/equifeed/app/[[...slug]]/page.tsx`

All non-API app routes render `ClientEntry`, which mounts the client-side React application.

### Client App

File: `artifacts/equifeed/src/App.tsx`

`App.tsx` is the main client-side router and gatekeeper. It:

- Creates a React Query client.
- Reads Clerk auth state with `useUser`.
- Syncs the authenticated Clerk user into the app database through `GET /api/me`.
- Persists synced user state in the Zustand user store.
- Routes unauthenticated users to sign-in/sign-up screens.
- Routes authenticated users without onboarding to `/onboarding`.
- Shows the authenticated app routes and fixed bottom navigation after onboarding.

## 5. Routing Map

Unauthenticated routes:

| Route | Screen | Purpose |
| --- | --- | --- |
| `/` | `SignIn` | Default unauthenticated landing/sign-in screen |
| `/sign-in` | `SignIn` | Email/password and Google sign-in |
| `/sign-up` | `SignUp` | Username/email/password and Google sign-up |
| `/sso-callback` | Next page | Clerk OAuth popup callback |

Onboarding route:

| Route | Screen | Purpose |
| --- | --- | --- |
| `/onboarding` | `Onboarding` | Choose `CONSUMER` or `CREATOR` role |

Authenticated app routes:

| Route | Screen | Purpose |
| --- | --- | --- |
| `/` | `Home` | Ranked feed with stories and theme toggle |
| `/explore` | `Explore` | Search mock posts by caption, hashtag, or creator |
| `/create` | `Create` | Creator-only upload flow |
| `/trends` | `Trends` | Trending content, topics, and hashtags |
| `/analytics` | `Analytics` | Creator-only score and performance analytics |
| `/profile` | `Profile` | Current user profile and settings |
| `/profile/:username` | `UserProfile` | Public profile for mock users |

Unknown authenticated routes redirect to `/`.

## 6. User Experience Flow

### First Visit

1. The app loads Clerk state.
2. If there is no signed-in Clerk session, the sign-in screen is shown.
3. Users can sign in with email/password or Google.
4. New users can sign up with username, email, password, or Google.

### User Sync

After Clerk reports a signed-in user:

1. The client calls `GET /api/me`.
2. The server reads the Clerk user.
3. The server upserts the user into `equifeed_users`.
4. The client stores the returned app user and onboarding status.

### Onboarding

If `onboardingComplete` is false:

1. The user is forced to `/onboarding`.
2. The user chooses `CONSUMER` or `CREATOR`.
3. The client calls `POST /api/me` with the chosen role.
4. The server updates role and marks onboarding complete.
5. The client enters the main app.

### Main App

After onboarding, the user sees the mobile app shell with bottom navigation. Creator-only screens are either blocked or show upgrade messaging when the current role is `CONSUMER`.

## 7. Screens And Features

### Sign In

File: `artifacts/equifeed/src/views/SignIn.tsx`

Features:

- Email/phone and password sign-in through Clerk.
- Google OAuth popup sign-in.
- Error messaging for failed auth attempts.
- Link to sign-up.

### Sign Up

File: `artifacts/equifeed/src/views/SignUp.tsx`

Features:

- Username, email, and password sign-up through Clerk.
- Google OAuth popup sign-up.
- Redirect to onboarding after successful account creation.
- Link back to sign-in.

### Onboarding

File: `artifacts/equifeed/src/views/Onboarding.tsx`

Features:

- Role selection between Consumer and Creator.
- Persists the role through `POST /api/me`.
- Updates the local store and navigates to the home feed.

### Home Feed

File: `artifacts/equifeed/src/views/Home.tsx`

Features:

- Fixed top header with EquiFeed wordmark.
- Dark/light theme toggle.
- Stories row.
- Feed container with ranked content.

Feed data is loaded by `useFeedStore.initFeed()`, which calls `/api/posts`. If the API fails or returns no posts, local mock posts are used.

### Explore

File: `artifacts/equifeed/src/views/Explore.tsx`

Features:

- Search input.
- Filters mock posts by caption, hashtag, or creator username.
- Displays matching posts in an explore grid.

### Create

File: `artifacts/equifeed/src/views/Create.tsx`

Features:

- Creator-only access.
- Upload area for image/video selection.
- Caption field with 2,200 character limit.
- Hashtag input.
- Content type selector.
- Upload progress and success state.
- Submits multipart form data to `POST /api/posts`.

Current scoring behavior is static on the server: uploaded posts are saved with `0.82` for quality, relevance, fairness, and final score, and `HIGH` rank tier.

### Trends

File: `artifacts/equifeed/src/views/Trends.tsx`

Features:

- Live status indicator.
- “Right Now” horizontal content strip.
- Tabs for Content, Topics, and Hashtags.
- Top content sorted by final score.
- Post detail sheet for selected posts.

This screen currently uses mock posts, topics, and hashtags.

### Analytics

File: `artifacts/equifeed/src/views/Analytics.tsx`

Features:

- Creator-only access.
- Time range selector.
- Total posts, likes, average score, and total views.
- Quality, relevance, and fairness score bars.
- Score chart.
- Performance-over-time chart.
- Post performance table.
- AI insights accordion.

Analytics currently uses mock creator analytics data.

### Profile

File: `artifacts/equifeed/src/views/Profile.tsx`

Features:

- Current user profile header.
- Mock grid of current user posts.
- Edit profile sheet.
- Theme toggle.
- Clerk sign-out plus local state reset.

### Public User Profile

File: `artifacts/equifeed/src/views/UserProfile.tsx`

Features:

- Loads public profiles from mock users by `username`.
- Shows that user’s mock posts.
- Supports local follow/unfollow state.
- Displays a not-found message for unknown usernames.

## 8. Navigation

File: `artifacts/equifeed/src/components/layout/BottomNav.tsx`

The bottom nav is fixed to the bottom of the viewport and exposes:

- Explore
- Create
- Trends
- Analytics
- Profile

`Create` and `Analytics` are creator-only navigation items. When the user is a consumer, those buttons are visually disabled.

## 9. State Management

### User Store

File: `artifacts/equifeed/src/store/userStore.ts`

The user store manages:

- Current profile.
- Current role.
- Authentication flag.
- Onboarding completion flag.
- Theme.
- Followed user IDs.

The store is persisted under the local storage key `equifeed-user`. Because `Set` cannot be serialized directly, followed users are converted to an array during persistence and converted back to `Set` during merge.

Important actions:

- `syncAuthenticatedUser(profile, onboardingComplete)`
- `completeOnboarding(role)`
- `toggleTheme()`
- `followUser(userId)`
- `unfollowUser(userId)`
- `signOut()`

### Feed Store

File: `artifacts/equifeed/src/store/feedStore.ts`

The feed store manages:

- Feed posts.
- Cursor.
- Loading state.
- Whether more posts exist.

Important actions:

- `initFeed()`: fetches `/api/posts`, with mock fallback.
- `appendPosts(posts)`
- `toggleLike(postId)`
- `setCursor(cursor)`

## 10. Backend API

### `GET /api/me`

File: `artifacts/equifeed/app/api/me/route.ts`

Purpose:

- Require a Clerk-authenticated user.
- Upsert Clerk profile data into the database.
- Return an app-shaped user object and onboarding status.

Responses:

- `200`: `{ user, onboardingComplete }`
- `401`: `{ error: "Unauthorized" }`

### `POST /api/me`

Purpose:

- Update the current user’s role.
- Mark onboarding complete.

Request body:

```json
{
  "role": "CONSUMER"
}
```

or:

```json
{
  "role": "CREATOR"
}
```

Responses:

- `200`: `{ user, onboardingComplete }`
- `400`: invalid role
- `401`: unauthenticated

### `GET /api/posts`

File: `artifacts/equifeed/app/api/posts/route.ts`

Purpose:

- Fetch up to 50 posts from `equifeed_posts`.
- Join each post to its creator from `equifeed_users`.
- Return feed-ready post objects ordered by newest first.

Response:

```json
{
  "posts": [],
  "nextCursor": null
}
```

Pagination is not implemented yet; `nextCursor` is always `null`.

### `POST /api/posts`

Purpose:

- Require authenticated user.
- Accept image/video multipart upload.
- Upload media to Cloudinary.
- Insert a new post into the database.
- Increment the creator’s `postsCount`.

Form fields:

- `file`: required image or video file.
- `caption`: optional text.
- `hashtags`: optional JSON array or comma-separated string.

Validation:

- Rejects missing media.
- Rejects non-image and non-video files.
- Rejects unauthenticated requests.
- Returns server error if Cloudinary config is missing.

Current scoring:

- `qualityScore`: `0.82`
- `relevanceScore`: `0.82`
- `fairnessScore`: `0.82`
- `finalScore`: `0.82`
- `rankTier`: `HIGH`

## 11. Database Model

File: `lib/db/src/schema/index.ts`

### Enums

`equifeed_role`

- `CONSUMER`
- `CREATOR`

`equifeed_content_type`

- `VIDEO`
- `IMAGE`
- `TEXT`

`equifeed_rank_tier`

- `HIGH`
- `MEDIUM`
- `LOW`

### `equifeed_users`

Stores app users synced from Clerk.

Important fields:

- `id`: UUID primary key.
- `clerkId`: unique Clerk user ID.
- `email`
- `username`: unique.
- `displayName`
- `bio`
- `avatarUrl`
- `role`
- `onboardingComplete`
- `postsCount`
- `followersCount`
- `followingCount`
- `createdAt`
- `updatedAt`

### `equifeed_posts`

Stores uploaded content.

Important fields:

- `id`: UUID primary key.
- `creatorId`: foreign key to `equifeed_users`.
- `cloudinaryPublicId`
- `contentUrl`
- `contentType`
- `caption`
- `hashtags`: JSON array.
- `finalScore`
- `qualityScore`
- `relevanceScore`
- `fairnessScore`
- `rankTier`
- `exposure`
- `likesCount`
- `commentsCount`
- `shares`
- `createdAt`
- `updatedAt`

## 12. Environment Variables

Template file: `.env.example`

Required for database-backed app behavior:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

Required for Clerk:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Required for Cloudinary uploads:

```bash
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
```

or:

```bash
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Google sign-in also requires Google to be enabled as a social connection in the Clerk dashboard.

## 13. Running The App

Install dependencies from the repository root:

```bash
pnpm install
```

Run the EquiFeed app:

```bash
pnpm --filter @workspace/equifeed dev
```

Build the full workspace:

```bash
pnpm run build
```

Typecheck the full workspace:

```bash
pnpm run typecheck
```

Run only the EquiFeed typecheck:

```bash
pnpm --filter @workspace/equifeed typecheck
```

## 14. Workspace Scripts

Root `package.json`:

- `build`: runs typecheck, then builds all packages with a build script.
- `typecheck:libs`: builds TypeScript project references.
- `typecheck`: typechecks libraries, artifacts, and scripts.

EquiFeed `package.json`:

- `dev`: runs Next dev server on `0.0.0.0`.
- `build`: runs `next build`.
- `serve`: runs `next start` on `0.0.0.0`.
- `typecheck`: runs TypeScript with no emit.

## 15. Important Components

### Feed Components

Directory: `artifacts/equifeed/src/components/feed`

Key responsibilities:

- Render the vertical feed.
- Display post media, caption, score overlay, and action controls.
- Show comment sheet.
- Show stories row.

### Explore Components

Directory: `artifacts/equifeed/src/components/explore`

Key responsibilities:

- Render post discovery grid.
- Show post detail sheet.

### Create Components

Directory: `artifacts/equifeed/src/components/create`

Key responsibilities:

- Upload area and media preview.
- File selection callback for create flow.

### Analytics Components

Directory: `artifacts/equifeed/src/components/analytics`

Key responsibilities:

- Score chart.
- Performance chart.
- Posts table.
- Insights accordion.
- Stat card component.

### Profile Components

Directory: `artifacts/equifeed/src/components/profile`

Key responsibilities:

- Profile header.
- Post grid.
- Edit profile sheet.

### Shared Components

Directory: `artifacts/equifeed/src/components/shared`

Key responsibilities:

- Score bars.
- Rank badges.
- Count-up animation.
- Tag input.

### UI Components

Directory: `artifacts/equifeed/src/components/ui`

This directory contains reusable Radix-style UI primitives such as buttons, dialogs, sheets, tabs, tables, inputs, toasts, and tooltips.

## 16. Theme And Styling

The app supports dark and light themes.

- Theme state is stored in `useUserStore`.
- Theme changes update `document.documentElement` with `data-theme`.
- Most screens derive colors from `theme` and CSS variables.
- The visual language is mobile-first, compact, high-contrast, and creator-tool oriented.

Key global styles are in:

- `artifacts/equifeed/src/index.css`

## 17. Mock Data Boundary

File: `artifacts/equifeed/src/data/mockData.ts`

Mock data currently supplies:

- Example users.
- Current user fallback.
- Feed fallback posts.
- Current user profile posts.
- Comments.
- Trending topics.
- Trending hashtags.
- Score history.
- Creator post analytics.

This means the app can still show a complete product experience even if the database has no posts or the API fails, but several screens are not yet fully backend-driven.

Backend-driven today:

- Clerk auth.
- User creation/sync.
- Role onboarding.
- Feed loading from database when posts exist.
- Media upload to Cloudinary.
- Post insertion into database.

Mock/prototype today:

- Explore data.
- Trends data.
- Analytics data.
- Comments.
- Stories.
- Public user profiles.
- Current user post grid.
- Like/follow persistence beyond local store.
- Real scoring algorithm.

## 18. Known Gaps And Next Steps

Recommended next implementation steps:

1. Replace trends and analytics mock data with real API endpoints.
2. Add database tables for likes, comments, follows, stories, and analytics events.
3. Implement real pagination for `GET /api/posts`.
4. Replace static post scoring with a real scoring service or algorithm.
5. Persist profile edits through an API route.
6. Persist follow/unfollow and like/unlike actions to the database.
7. Add upload error messages in the create screen.
8. Add tests for auth sync, onboarding, post upload validation, and feed fallback behavior.
9. Clean up mojibake characters in a few UI strings where symbols appear incorrectly encoded.
10. Add database migration scripts or documented Drizzle migration workflow.

## 19. Glossary

- Fairness score: a ranking signal intended to reduce follower-count bias.
- Final score: the combined score used to rank content.
- Rank tier: human-readable classification of score strength: `HIGH`, `MEDIUM`, or `LOW`.
- Exposure: view/reach-style metric used in analytics and post cards.
- Creator: a user role that can upload content and view analytics.
- Consumer: a user role focused on discovering and viewing content.
