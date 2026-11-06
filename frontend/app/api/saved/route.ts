import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ids: [] });

  const { data, error } = await adminSupabase()
    .from("saved")
    .select("restaurant_id")
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Failed to load saved places" }, { status: 500 });

  return NextResponse.json({ ids: (data ?? []).map((r) => r.restaurant_id) });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id } = await req.json();

  // Saved and visited/rated are mutually exclusive -- can't bookmark
  // something you've already been to and rated.
  const { data: existingRating, error: ratingError } = await adminSupabase()
    .from("ratings")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant_id)
    .maybeSingle();
  if (ratingError) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  if (existingRating) {
    return NextResponse.json({ error: "Already marked as visited" }, { status: 409 });
  }

  const { error } = await adminSupabase().from("saved").upsert({ user_id: user.id, restaurant_id });
  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id } = await req.json();
  const { error } = await adminSupabase()
    .from("saved")
    .delete()
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant_id);
  if (error) return NextResponse.json({ error: "Failed to unsave" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
