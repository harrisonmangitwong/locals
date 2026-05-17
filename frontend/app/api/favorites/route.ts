import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ids: [] });

  const { data } = await supabase()
    .from("favorites")
    .select("restaurant_id")
    .eq("user_id", session.user.id);

  return NextResponse.json({ ids: (data ?? []).map((r) => r.restaurant_id) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id } = await req.json();
  await supabase().from("favorites").upsert({ user_id: session.user.id, restaurant_id });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { restaurant_id } = await req.json();
  await supabase()
    .from("favorites")
    .delete()
    .eq("user_id", session.user.id)
    .eq("restaurant_id", restaurant_id);

  return NextResponse.json({ ok: true });
}
