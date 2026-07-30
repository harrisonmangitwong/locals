import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const MAX_NAME_LENGTH = 200;
const MAX_NOTE_LENGTH = 500;

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

  const { restaurant_name, note } = await req.json();
  const name = typeof restaurant_name === "string" ? restaurant_name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "Restaurant name is too long" }, { status: 400 });
  }
  const trimmedNote = typeof note === "string" ? note.trim().slice(0, MAX_NOTE_LENGTH) : null;

  const { error } = await adminSupabase()
    .from("restaurant_requests")
    .insert({ user_id: user.id, restaurant_name: name, note: trimmedNote || null });

  if (error) {
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
