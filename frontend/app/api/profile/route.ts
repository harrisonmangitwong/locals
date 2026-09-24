import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveLocalIds } from "@/lib/server/activeLocal";
import { NextRequest, NextResponse } from "next/server";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const RESERVED_USERNAMES = new Set([
  "about",
  "recommendations",
  "favorites",
  "visited",
  "requests",
  "sign-in",
  "auth",
  "api",
  "list",
  "u",
  "profile",
  "restaurant",
  "onboarding",
]);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [{ data }, activeLocalIds, { count: savedCount }, { count: visitedCount }] = await Promise.all([
    admin
      .from("profiles")
      .select("username, is_private, preferred_neighborhoods, preferred_cuisines, preferred_price")
      .eq("user_id", user.id)
      .maybeSingle(),
    getActiveLocalIds(admin, [user.id]),
    admin.from("saved").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    admin.from("ratings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return NextResponse.json({
    username: data?.username ?? null,
    is_private: data?.is_private ?? false,
    isActiveLocal: activeLocalIds.has(user.id),
    savedCount: savedCount ?? 0,
    visitedCount: visitedCount ?? 0,
    preferredNeighborhoods: data?.preferred_neighborhoods ?? [],
    preferredCuisines: data?.preferred_cuisines ?? [],
    preferredPrice: data?.preferred_price ?? null,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json();
  if (typeof username !== "string" || !USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters: lowercase letters, numbers, and underscores only" },
      { status: 400 }
    );
  }
  if (RESERVED_USERNAMES.has(username)) {
    return NextResponse.json({ error: "That username is reserved" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .upsert({ user_id: user.id, username, updated_at: new Date().toISOString() });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That username is taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update username" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username });
}
