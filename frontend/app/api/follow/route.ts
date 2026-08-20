import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/follow  { target_user_id }
// Follows instantly if the target is public, sends a pending request if private.
// Idempotent: if a follow/request already exists, leaves it as-is rather than
// re-evaluating the target's current privacy setting (going private later
// shouldn't retroactively downgrade an already-accepted follower to pending).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_user_id } = await req.json();
  if (typeof target_user_id !== "string" || !target_user_id) {
    return NextResponse.json({ error: "target_user_id is required" }, { status: 400 });
  }
  if (target_user_id === user.id) {
    return NextResponse.json({ error: "Can't follow yourself" }, { status: 400 });
  }

  const admin = adminSupabase();

  const { data: existing } = await admin
    .from("follows")
    .select("status")
    .eq("follower_id", user.id)
    .eq("following_id", target_user_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ status: existing.status });
  }

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("is_private")
    .eq("user_id", target_user_id)
    .maybeSingle();

  const status = targetProfile?.is_private ? "pending" : "accepted";

  const { error } = await admin
    .from("follows")
    .insert({ follower_id: user.id, following_id: target_user_id, status });

  if (error) {
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
  }

  return NextResponse.json({ status });
}

// DELETE /api/follow  { target_user_id }
// Unfollows (if accepted) or cancels a request you sent (if pending).
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_user_id } = await req.json();
  if (typeof target_user_id !== "string" || !target_user_id) {
    return NextResponse.json({ error: "target_user_id is required" }, { status: 400 });
  }

  await adminSupabase()
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", target_user_id);

  return NextResponse.json({ ok: true });
}
