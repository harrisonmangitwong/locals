import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/follow/status?userId=X
// Returns my relationship to user X: "self" | "accepted" | "pending" | "none"
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "none" });

  const targetUserId = req.nextUrl.searchParams.get("userId");
  if (!targetUserId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  if (targetUserId === user.id) {
    return NextResponse.json({ status: "self" });
  }

  const { data } = await adminSupabase()
    .from("follows")
    .select("status")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  return NextResponse.json({ status: data?.status ?? "none" });
}
