import { auth, currentUser } from "@clerk/nextjs/server";
import { db, usersTable, type DbUser } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import type { User as AppUser, Role } from "../../../src/types";

function cleanUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 30);
}

function getProfileFields(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    throw new Error("No Clerk user available");
  }

  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const fallbackUsername = email?.split("@")[0] ?? `user_${user.id.slice(-8)}`;
  const username = cleanUsername(user.username ?? fallbackUsername);
  const displayName =
    user.fullName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    username;

  return {
    clerkId: user.id,
    email,
    username,
    displayName,
    avatarUrl: user.imageUrl ?? null,
  };
}

export function toAppUser(user: DbUser): AppUser {
  return {
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    postsCount: user.postsCount,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
  };
}

export async function requireCurrentDbUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Clerk session is invalid");
  }

  const fields = getProfileFields(clerkUser);

  try {
    const [dbUser] = await db
      .insert(usersTable)
      .values(fields)
      .onConflictDoUpdate({
        target: usersTable.clerkId,
        set: {
          email: fields.email,
          displayName: fields.displayName,
          avatarUrl: fields.avatarUrl,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    return dbUser;
  } catch (error: any) {
    const code = error?.code ?? error?.cause?.code;
    const detail = String(error?.detail ?? error?.cause?.detail ?? "");

    // If username collision happens for a NEW user (not the one matching clerkId)
    if (code === '23505' && detail.includes('username')) {
      const uniqueFields = {
        ...fields,
        username: `${fields.username}_${Math.random().toString(36).slice(-4)}`
      };
      
      const [retryUser] = await db
        .insert(usersTable)
        .values(uniqueFields)
        .onConflictDoUpdate({
          target: usersTable.clerkId,
          set: {
            email: uniqueFields.email,
            displayName: uniqueFields.displayName,
            avatarUrl: uniqueFields.avatarUrl,
            updatedAt: sql`now()`,
          },
        })
        .returning();
        
      return retryUser;
    }
    throw error;
  }
}

export async function updateCurrentDbUserRole(role: Role) {
  const dbUser = await requireCurrentDbUser();

  if (!dbUser) {
    return null;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role, onboardingComplete: true, updatedAt: sql`now()` })
    .where(eq(usersTable.id, dbUser.id))
    .returning();

  return updated;
}
