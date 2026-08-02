import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const VALID_BUCKETS = ["liked", "ok", "disliked"] as const;
const VALID_TAGS = ["atmosphere", "food_quality", "service"] as const;

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id, bucket, final_rank, tags } = await req.json();

  if (typeof restaurant_id !== "string" || !restaurant_id.trim()) {
    return NextResponse.json({ error: "restaurant_id is required" }, { status: 400 });
  }
  if (!VALID_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }
  if (!Number.isInteger(final_rank) || final_rank < 1) {
    return NextResponse.json({ error: "Invalid final_rank" }, { status: 400 });
  }
  const cleanTags = Array.isArray(tags) ? tags.filter((t) => VALID_TAGS.includes(t)) : [];

  const { error } = await adminSupabase().rpc("submit_rating", {
    p_user_id: user.id,
    p_restaurant_id: restaurant_id,
    p_bucket: bucket,
    p_final_rank: final_rank,
    p_tags: cleanTags,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
