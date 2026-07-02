import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:8000";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/public/saved?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data: savedRows } = await adminSupabase()
    .from("saved")
    .select("restaurant_id")
    .eq("user_id", userId);

  const ids = (savedRows ?? []).map((r) => r.restaurant_id);
  if (ids.length === 0) return NextResponse.json({ results: [], name: null });

  const res = await fetch(`${API_BASE}/api/restaurants/batch?ids=${ids.join(",")}`);
  if (!res.ok) return NextResponse.json({ results: [], name: null });
  const json = await res.json();

  // Fetch display name from auth.users metadata
  const { data: userData } = await adminSupabase().auth.admin.getUserById(userId);
  const name = userData?.user?.user_metadata?.full_name ?? userData?.user?.email ?? null;

  return NextResponse.json({ results: json.results ?? [], name });
}
