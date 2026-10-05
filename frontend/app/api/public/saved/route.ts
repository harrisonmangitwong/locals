import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
    .select("bio, avatar_url, is_private")
    .eq("user_id", userId)
    .maybeSingle();
  const bio = aboutRow?.bio ?? null;
  const avatarUrl = aboutRow?.avatar_url ?? null;
  const isPrivate = aboutRow?.is_private ?? false;

  // The privacy toggle previously only gated the follow *button* (instant
  // accept vs. a pending request) -- this endpoint returned the full saved
  // list to anyone who hit it regardless of approval status. The actual
  // boundary belongs here: owner or an accepted follower sees the list,
  // everyone else gets identity info (name/bio/avatar, so they know who
  // they're looking at) but not the content.
  let canViewContent = !isPrivate;
  if (!canViewContent) {
    const viewerClient = await createClient();
    const { data: { user: viewer } } = await viewerClient.auth.getUser();
    if (viewer) {
      if (viewer.id === userId) {
        canViewContent = true;
      } else {
        const { data: followRow } = await admin
          .from("follows")
          .select("status")
          .eq("follower_id", viewer.id)
          .eq("following_id", userId)
          .maybeSingle();
        canViewContent = followRow?.status === "accepted";
      }
    }
  }

  if (!canViewContent) {
    return NextResponse.json({ results: [], name, userId, bio, avatarUrl, isPrivate: true });
  }

  const { data: savedRows } = await admin
    .from("saved")
    .select("restaurant_id")
    .eq("user_id", userId);

  const ids = (savedRows ?? []).map((r) => r.restaurant_id);
  if (ids.length === 0) return NextResponse.json({ results: [], name, userId, bio, avatarUrl, isPrivate });

  const res = await fetch(`${API_BASE}/api/restaurants/batch?ids=${ids.join(",")}`);
  if (!res.ok) return NextResponse.json({ results: [], name, userId, bio, avatarUrl, isPrivate });
  const json = await res.json();

  const activeLocalIds = await getActiveLocalIds(admin, [userId]);

  return NextResponse.json({
    results: json.results ?? [],
    name,
    userId,
    bio,
    avatarUrl,
    isPrivate,
    isActiveLocal: activeLocalIds.has(userId),
  });
}
