import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/ratings                                    -> all of this user's ratings
// GET /api/ratings?bucket=liked                        -> just that bucket, ordered by rank
// GET /api/ratings?bucket=liked&exclude=r_abc123        -> same, excluding one restaurant (for edit flows)
// GET /api/ratings?restaurant_id=r_abc123               -> just this one restaurant's rating, if any
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ratings: [] });

  const bucket = req.nextUrl.searchParams.get("bucket");
  const exclude = req.nextUrl.searchParams.get("exclude");
  const restaurantId = req.nextUrl.searchParams.get("restaurant_id");

  let query = adminSupabase()
    .from("ratings")
    .select("restaurant_id, bucket, rank_position, score, tags")
    .eq("user_id", user.id);

  if (bucket) query = query.eq("bucket", bucket);
  if (exclude) query = query.neq("restaurant_id", exclude);
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);

  const { data } = await query.order("rank_position", { ascending: true });

  return NextResponse.json({ ratings: data ?? [] });
}
