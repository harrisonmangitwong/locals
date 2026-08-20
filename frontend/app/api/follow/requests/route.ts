import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/follow/requests
// Lists pending incoming follow requests (people who want to follow me).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ requests: [] });

  const admin = adminSupabase();

  const { data: pending } = await admin
    .from("follows")
    .select("follower_id, created_at")
    .eq("following_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const requests = await Promise.all(
    (pending ?? []).map(async (row) => {
      const { data: userData } = await admin.auth.admin.getUserById(row.follower_id);
      const name = userData?.user?.user_metadata?.full_name ?? userData?.user?.email ?? "Someone";
      const avatarUrl = userData?.user?.user_metadata?.avatar_url ?? null;
      return { userId: row.follower_id, name, avatarUrl, createdAt: row.created_at };
    })
  );

  return NextResponse.json({ requests });
}
