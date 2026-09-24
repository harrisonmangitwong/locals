import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/follow/counts?userId=X
// Public -- no auth required, matches how the saved list itself has no
// privacy gate today (is_private only ever gated whether a follow needs
// approval, never visibility of counts or lists).
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const admin = createAdminClient();

  const [{ count: followers }, { count: following }] = await Promise.all([
    admin.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId).eq("status", "accepted"),
    admin.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId).eq("status", "accepted"),
  ]);

  return NextResponse.json({ followers: followers ?? 0, following: following ?? 0 });
}
