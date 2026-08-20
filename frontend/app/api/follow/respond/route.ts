import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/follow/respond  { requester_id, action: "accept" | "decline" }
// Responds to an incoming follow request (someone who wants to follow me).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requester_id, action } = await req.json();
  if (typeof requester_id !== "string" || !requester_id) {
    return NextResponse.json({ error: "requester_id is required" }, { status: 400 });
  }
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "action must be accept or decline" }, { status: 400 });
  }

  const admin = adminSupabase();

  if (action === "accept") {
    const { error } = await admin
      .from("follows")
      .update({ status: "accepted" })
      .eq("follower_id", requester_id)
      .eq("following_id", user.id)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: "Failed to accept" }, { status: 500 });
  } else {
    await admin
      .from("follows")
      .delete()
      .eq("follower_id", requester_id)
      .eq("following_id", user.id)
      .eq("status", "pending");
  }

  return NextResponse.json({ ok: true });
}
