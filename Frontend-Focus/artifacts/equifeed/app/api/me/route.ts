import { NextResponse } from "next/server";
import { requireCurrentDbUser, toAppUser, updateCurrentDbUserRole } from "../_lib/users";
import type { Role } from "../../../src/types";

const roles = new Set<Role>(["CONSUMER", "CREATOR"]);

export const runtime = "nodejs";

export async function GET() {
  const dbUser = await requireCurrentDbUser();

  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: toAppUser(dbUser),
    onboardingComplete: dbUser.onboardingComplete,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { role?: Role };

  if (!body.role || !roles.has(body.role)) {
    return NextResponse.json({ error: "Role must be CONSUMER or CREATOR" }, { status: 400 });
  }

  const dbUser = await updateCurrentDbUserRole(body.role);

  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: toAppUser(dbUser),
    onboardingComplete: dbUser.onboardingComplete,
  });
}
