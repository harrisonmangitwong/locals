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

  const { data } = await adminSupabase()
    .from("favorites")
    .select("restaurant_id")
    .eq("user_id", user.id);

  return NextResponse.json({ ids: (data ?? []).map((r) => r.restaurant_id) });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id } = await req.json();
  await adminSupabase().from("favorites").upsert({ user_id: user.id, restaurant_id });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id } = await req.json();
  await adminSupabase()
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant_id);

  return NextResponse.json({ ok: true });
}
