import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users/search?q=<query>
//
// Matches against username AND display name. Display names only live in
// Supabase's auth.users.user_metadata, never in `profiles`, so there's no
// indexed column to search -- this fetches every profile and every auth
// user in one shot and filters in memory. That's fine at this app's scale
// (~8 users) but won't hold up if the user base ever grows past a few
// hundred; the real fix then is denormalizing a searchable display_name
// column onto `profiles`, synced at sign-in.
//
// Private accounts are included in results (so they're findable to send a
// follow request) -- their actual saved-restaurant content stays gated on
// their profile page regardless, same boundary as everywhere else.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ people: [] });

  const admin = createAdminClient();

  const [{ data: profiles }, { data: usersPage }] = await Promise.all([
    admin.from("profiles").select("user_id, username, is_private, avatar_url"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const userById = new Map(usersPage?.users.map((u) => [u.id, u]) ?? []);

  // Exclude the searcher themselves, if signed in.
  const viewerClient = await createClient();
  const { data: { user: viewer } } = await viewerClient.auth.getUser();

  const results = (profiles ?? [])
    .filter((p) => p.user_id !== viewer?.id)
    .map((p) => {
      const authUser = userById.get(p.user_id);
      const name: string = authUser?.user_metadata?.full_name ?? authUser?.email ?? "Someone";
      return {
        userId: p.user_id as string,
        username: p.username as string | null,
        name,
        avatarUrl: (p.avatar_url as string | null) ?? authUser?.user_metadata?.avatar_url ?? null,
        isPrivate: !!p.is_private,
      };
    })
    .filter((p) => p.username?.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
    .slice(0, 20);

  return NextResponse.json({ people: results });
}
