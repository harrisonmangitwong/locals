import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/save-counts?ids=id1,id2,...
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({ counts: {} });

  const { data } = await adminSupabase()
    .from("saved")
    .select("restaurant_id")
    .in("restaurant_id", ids);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.restaurant_id] = (counts[row.restaurant_id] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
