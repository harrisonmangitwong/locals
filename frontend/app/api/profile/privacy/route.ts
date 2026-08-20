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
  if (!user) return NextResponse.json({ is_private: false });

  const { data } = await adminSupabase()
    .from("profiles")
    .select("is_private")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ is_private: data?.is_private ?? false });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { is_private } = await req.json();
  if (typeof is_private !== "boolean") {
    return NextResponse.json({ error: "is_private must be a boolean" }, { status: 400 });
  }

  await adminSupabase()
    .from("profiles")
    .upsert({ user_id: user.id, is_private, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
