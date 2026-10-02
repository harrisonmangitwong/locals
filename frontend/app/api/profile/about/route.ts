import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const MAX_BIO_LENGTH = 280;

// POST /api/profile/about  { bio?, avatar_url? }
// Both fields are independently optional so the photo-upload action and the
// bio-save action can each call this with just their own field.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bio, avatar_url } = await req.json();

  if (bio !== undefined && (typeof bio !== "string" || bio.length > MAX_BIO_LENGTH)) {
    return NextResponse.json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` }, { status: 400 });
  }
  if (avatar_url !== undefined && typeof avatar_url !== "string") {
    return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .upsert({
      user_id: user.id,
      ...(bio !== undefined ? { bio } : {}),
      ...(avatar_url !== undefined ? { avatar_url } : {}),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === "23514") {
      return NextResponse.json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, bio, avatar_url });
}
