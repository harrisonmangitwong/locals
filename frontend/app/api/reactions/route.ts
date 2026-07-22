import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const VALID_REACTIONS = ["better", "expected", "disappointing"] as const;

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ reactions: {} });

  const { data } = await adminSupabase()
    .from("reactions")
    .select("restaurant_id, reaction")
    .eq("user_id", user.id);

  const reactions: Record<string, string> = {};
  for (const row of data ?? []) {
    reactions[row.restaurant_id] = row.reaction;
  }

  return NextResponse.json({ reactions });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id, reaction } = await req.json();
  if (!VALID_REACTIONS.includes(reaction)) {
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
  }
  await adminSupabase()
    .from("reactions")
    .upsert({ user_id: user.id, restaurant_id, reaction });

  return NextResponse.json({ ok: true });
}
