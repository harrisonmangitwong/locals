import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/follow-save-counts?ids=id1,id2,...
// Per restaurant, how many people the current user follows (accepted only) have saved it.
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({ counts: {} });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ counts: {} });

  const admin = adminSupabase();

  const { data: followedRows } = await admin
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .eq("status", "accepted");

  const followedIds = (followedRows ?? []).map((r) => r.following_id);
  if (followedIds.length === 0) return NextResponse.json({ counts: {} });

  const { data: savedRows } = await admin
    .from("saved")
    .select("restaurant_id")
    .in("restaurant_id", ids)
    .in("user_id", followedIds);

  const counts: Record<string, number> = {};
  for (const row of savedRows ?? []) {
    counts[row.restaurant_id] = (counts[row.restaurant_id] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
