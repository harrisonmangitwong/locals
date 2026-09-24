import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/profile/preferences  { neighborhoods, cuisines, price }
// Upserts declared preferences onto the profiles row. Used by both the
// onboarding flow and the editable Preferences section on /profile --
// one code path, since "changeable at any time" means the same write.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { neighborhoods, cuisines, price } = await req.json();
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

  const { error } = await createAdminClient()
    .from("profiles")
    .upsert({
      user_id: user.id,
      preferred_neighborhoods: asStringArray(neighborhoods),
      preferred_cuisines: asStringArray(cuisines),
      preferred_price: asStringArray(price),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
