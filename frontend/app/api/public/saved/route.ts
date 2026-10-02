import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveLocalIds } from "@/lib/server/activeLocal";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// GET /api/public/saved?userId=xxx  or  ?username=xxx
export async function GET(req: NextRequest) {
  const admin = createAdminClient();

  let userId = req.nextUrl.searchParams.get("userId");
  const username = req.nextUrl.searchParams.get("username");

  if (!userId && username) {
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "No profile with that username" }, { status: 404 });
    userId = profile.user_id;
  }

  if (!userId) return NextResponse.json({ error: "Missing userId or username" }, { status: 400 });

  // Fetch display name from auth.users metadata
  const { data: userData } = await admin.auth.admin.getUserById(userId);
  const name = userData?.user?.user_metadata?.full_name ?? userData?.user?.email ?? null;

  const { data: aboutRow } = await admin
    .from("profiles")
    .select("bio, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  const bio = aboutRow?.bio ?? null;
  const avatarUrl = aboutRow?.avatar_url ?? null;

  const { data: savedRows } = await admin
    .from("saved")
    .select("restaurant_id")
    .eq("user_id", userId);

  const ids = (savedRows ?? []).map((r) => r.restaurant_id);
  if (ids.length === 0) return NextResponse.json({ results: [], name, userId, bio, avatarUrl });

  const res = await fetch(`${API_BASE}/api/restaurants/batch?ids=${ids.join(",")}`);
  if (!res.ok) return NextResponse.json({ results: [], name, userId, bio, avatarUrl });
  const json = await res.json();

  const activeLocalIds = await getActiveLocalIds(admin, [userId]);

  return NextResponse.json({
    results: json.results ?? [],
    name,
    userId,
    bio,
    avatarUrl,
    isActiveLocal: activeLocalIds.has(userId),
  });
}
