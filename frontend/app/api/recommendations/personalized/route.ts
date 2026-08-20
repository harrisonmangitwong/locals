import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:8000";
const MIN_SIGNAL = 5; // combined saves + ratings needed before personalizing at all

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function priceTier(midpoint: number | null | undefined): string | null {
  if (midpoint == null) return null;
  if (midpoint <= 15) return "$";
  if (midpoint <= 30) return "$$";
  if (midpoint <= 60) return "$$$";
  return "$$$$";
}

// liked > ok > saved-with-no-rating > (disliked pushes down, not just "less up")
const WEIGHT: Record<string, number> = { liked: 3, ok: 2, saved: 1, disliked: -3 };

type RestaurantRow = Record<string, unknown> & {
  restaurant_id: string;
  cuisine?: string;
  neighborhood?: string;
  price_midpoint?: number | null;
  archetype?: string | null;
  p_safe_pick?: number;
};

function forwardableParams(params: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const key of ["neighborhood", "cuisine", "price", "search", "open_now", "archetype"]) {
    const v = params.get(key);
    if (v) out.set(key, v);
  }
  return out;
}

async function fetchPlainFeed(params: URLSearchParams, page: number, pageSize: number) {
  const p = forwardableParams(params);
  p.set("page", String(page));
  p.set("page_size", String(pageSize));
  const res = await fetch(`${API_BASE}/api/recommendations?${p.toString()}`);
  return NextResponse.json(await res.json());
}

// Backend caps page_size at 100, so pull the full filtered set page by page.
async function fetchAllFiltered(baseParams: URLSearchParams) {
  const p = new URLSearchParams(baseParams);
  p.set("page", "1");
  p.set("page_size", "100");
  const firstRes = await fetch(`${API_BASE}/api/recommendations?${p.toString()}`);
  if (!firstRes.ok) throw new Error("Failed to load recommendations");
  const firstJson = await firstRes.json();
  const totalPages: number = firstJson.total_pages ?? 1;
  const results: RestaurantRow[] = [...(firstJson.results ?? [])];

  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => {
        const pp = new URLSearchParams(baseParams);
        pp.set("page", String(i + 2));
        pp.set("page_size", "100");
        return fetch(`${API_BASE}/api/recommendations?${pp.toString()}`).then((r) => r.json());
      })
    );
    for (const r of rest) results.push(...(r.results ?? []));
  }

  return { results, neighborhoods: firstJson.neighborhoods ?? [], cuisines: firstJson.cuisines ?? [] };
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = parseInt(params.get("page") ?? "1", 10);
  const pageSize = parseInt(params.get("page_size") ?? "20", 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fetchPlainFeed(params, page, pageSize);

  const admin = adminSupabase();
  const [{ data: ratingRows }, { data: savedRows }] = await Promise.all([
    admin.from("ratings").select("restaurant_id, bucket").eq("user_id", user.id),
    admin.from("saved").select("restaurant_id").eq("user_id", user.id),
  ]);

  const ratings = ratingRows ?? [];
  const saved = savedRows ?? [];

  // Not enough signal yet -- fall back to the plain feed rather than personalizing on thin data.
  if (ratings.length + saved.length < MIN_SIGNAL) return fetchPlainFeed(params, page, pageSize);

  const bucketByRestaurant: Record<string, string> = {};
  for (const r of ratings) bucketByRestaurant[r.restaurant_id] = r.bucket;
  const ratedIds = new Set(Object.keys(bucketByRestaurant));
  const savedOnlyIds = saved.map((r) => r.restaurant_id).filter((id) => !ratedIds.has(id));
  const signalIds = [...ratedIds, ...savedOnlyIds];

  const [candidateSet, signalRes] = await Promise.all([
    fetchAllFiltered(forwardableParams(params)),
    fetch(`${API_BASE}/api/restaurants/batch?ids=${signalIds.join(",")}`),
  ]);
  const signalRestaurants: RestaurantRow[] = signalRes.ok ? (await signalRes.json()).results ?? [] : [];

  const cuisineAff: Record<string, number> = {};
  const neighborhoodAff: Record<string, number> = {};
  const priceAff: Record<string, number> = {};
  const archetypeAff: Record<string, number> = {};

  function bump(map: Record<string, number>, key: string | null | undefined, weight: number) {
    if (!key) return;
    map[key] = (map[key] ?? 0) + weight;
  }

  for (const r of signalRestaurants) {
    const weight = WEIGHT[bucketByRestaurant[r.restaurant_id] ?? "saved"];
    bump(cuisineAff, r.cuisine, weight);
    bump(neighborhoodAff, r.neighborhood, weight);
    bump(priceAff, priceTier(r.price_midpoint), weight);
    bump(archetypeAff, r.archetype, weight);
  }

  function affinityScore(r: RestaurantRow): number {
    return (
      (cuisineAff[r.cuisine ?? ""] ?? 0) +
      (neighborhoodAff[r.neighborhood ?? ""] ?? 0) +
      (priceAff[priceTier(r.price_midpoint) ?? ""] ?? 0) +
      (r.archetype ? (archetypeAff[r.archetype] ?? 0) : 0)
    );
  }

  // Affinity match first; the existing trust ranking (p_safe_pick) breaks ties, it never gets overridden by it.
  const sorted = [...candidateSet.results].sort((a, b) => {
    const diff = affinityScore(b) - affinityScore(a);
    if (diff !== 0) return diff;
    return (b.p_safe_pick ?? 0) - (a.p_safe_pick ?? 0);
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageResults = sorted.slice(start, start + pageSize).map((r, i) => ({ ...r, rank: start + i + 1 }));

  return NextResponse.json({
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    neighborhoods: candidateSet.neighborhoods,
    cuisines: candidateSet.cuisines,
    results: pageResults,
  });
}
