import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/onboarding/complete  { favoriteRestaurantIds: string[] }
// Empty array is valid -- that's what "Skip" sends. Saves any picked
// restaurants exactly like a normal bookmark (same `saved` table), which
// is what lets them count toward personalization's existing 5-signal
// threshold with no new ranking logic. Always marks onboarding_completed
// regardless of whether anything was picked.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { favoriteRestaurantIds } = await req.json();
  const ids: string[] = Array.isArray(favoriteRestaurantIds)
    ? favoriteRestaurantIds.filter((x) => typeof x === "string")
    : [];

  const admin = createAdminClient();

  if (ids.length > 0) {
    const rows = ids.map((restaurant_id) => ({ user_id: user.id, restaurant_id }));
    await admin.from("saved").upsert(rows);
  }

  const { error } = await admin
    .from("profiles")
    .upsert({ user_id: user.id, onboarding_completed: true, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
