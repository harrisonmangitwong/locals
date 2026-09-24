import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveLocalIds } from "@/lib/server/activeLocal";
import { NextRequest, NextResponse } from "next/server";

// GET /api/follow/list?userId=X&type=followers|following
// Public -- same reasoning as /api/follow/counts.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const type = req.nextUrl.searchParams.get("type");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  if (type !== "followers" && type !== "following") {
    return NextResponse.json({ error: "type must be followers or following" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("follows")
    .select(type === "followers" ? "follower_id, created_at" : "following_id, created_at")
    .eq(type === "followers" ? "following_id" : "follower_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r: Record<string, unknown>) =>
    (type === "followers" ? r.follower_id : r.following_id) as string
  );

  if (ids.length === 0) return NextResponse.json({ people: [] });

  const [activeLocalIds, { data: profileRows }] = await Promise.all([
    getActiveLocalIds(admin, ids),
    admin.from("profiles").select("user_id, username").in("user_id", ids),
  ]);

  const usernameByUserId: Record<string, string | null> = {};
  for (const row of profileRows ?? []) usernameByUserId[row.user_id] = row.username;

  const people = await Promise.all(
    ids.map(async (id) => {
      const { data: userData } = await admin.auth.admin.getUserById(id);
      const name = userData?.user?.user_metadata?.full_name ?? userData?.user?.email ?? "Someone";
      const avatarUrl = userData?.user?.user_metadata?.avatar_url ?? null;
      return {
        userId: id,
        username: usernameByUserId[id] ?? null,
        name,
        avatarUrl,
        isActiveLocal: activeLocalIds.has(id),
      };
    })
  );

  return NextResponse.json({ people });
}
