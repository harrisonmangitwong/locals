import type { SupabaseClient } from "@supabase/supabase-js";

// Fixed minimum, not a percentile — stable regardless of how small the user base is.
// Counts saves + ratings (a rating implies a visit) as one combined activity total.
const ACTIVITY_THRESHOLD = 10;

export async function getActiveLocalIds(admin: SupabaseClient, userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const [{ data: savedRows }, { data: ratingRows }] = await Promise.all([
    admin.from("saved").select("user_id").in("user_id", userIds),
    admin.from("ratings").select("user_id").in("user_id", userIds),
  ]);

  const counts: Record<string, number> = {};
  for (const row of savedRows ?? []) counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
  for (const row of ratingRows ?? []) counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;

  const active = new Set<string>();
  for (const [id, count] of Object.entries(counts)) {
    if (count >= ACTIVITY_THRESHOLD) active.add(id);
  }
  return active;
}
