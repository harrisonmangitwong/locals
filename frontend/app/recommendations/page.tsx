"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import RestaurantCard from "@/components/RestaurantCard";
import UserMenu from "@/components/UserMenu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Approximate center coordinates for each neighborhood in the dataset
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  // Manhattan
  "Battery Park City": [40.7117, -74.0154],
  "Chelsea": [40.7465, -74.0014],
  "East Harlem": [40.7957, -73.9425],
  "East Village": [40.7265, -73.9815],
  "Financial District": [40.7075, -74.0089],
  "Harlem": [40.8116, -73.9465],
  "Lower East Side": [40.7150, -73.9843],
  "Midtown": [40.7549, -73.9840],
  "Midtown East": [40.7550, -73.9680],
  "Murray Hill": [40.7489, -73.9760],
  "Roosevelt Island": [40.7620, -73.9510],
  "SoHo": [40.7233, -74.0030],
  "Tribeca": [40.7163, -74.0086],
  "Upper East Side": [40.7736, -73.9566],
  "Upper West Side": [40.7870, -73.9754],
  "Washington Heights": [40.8417, -73.9394],
  "West Village": [40.7336, -74.0027],
  // Brooklyn
  "Bay Ridge": [40.6264, -74.0310],
  "Bedford-Stuyvesant": [40.6834, -73.9413],
  "Bushwick": [40.6942, -73.9214],
  "Brooklyn Heights": [40.6960, -73.9936],
  "Crown Heights": [40.6694, -73.9422],
  "Downtown Brooklyn": [40.6930, -73.9867],
  "Dumbo": [40.7033, -73.9890],
  "Fort Greene": [40.6885, -73.9770],
  "Greenpoint": [40.7282, -73.9510],
  "Park Slope": [40.6710, -73.9814],
  "Prospect Lefferts Gardens": [40.6595, -73.9525],
  "Sunset Park": [40.6454, -74.0104],
  "Williamsburg": [40.7081, -73.9571],
  // Queens
  "Astoria": [40.7723, -73.9301],
  "Bayside": [40.7686, -73.7714],
  "Corona": [40.7450, -73.8602],
  "Elmhurst": [40.7360, -73.8780],
  "Flushing": [40.7580, -73.8296],
  "Forest Hills": [40.7185, -73.8443],
  "Jackson Heights": [40.7557, -73.8831],
  "Jamaica": [40.7029, -73.7898],
  "Long Island City": [40.7447, -73.9485],
  "Ridgewood": [40.7043, -73.9018],
  "Sunnyside": [40.7433, -73.9196],
  "Woodside": [40.7454, -73.9030],
  // Bronx
  "Belmont": [40.8537, -73.8876],
  "East Bronx": [40.8370, -73.8554],
  "Fordham Heights": [40.8615, -73.8985],
  "Melrose": [40.8246, -73.9127],
  "West Bronx": [40.8540, -73.9090],
  // Staten Island
  "Rosebank": [40.6137, -74.0665],
  "Staten Island": [40.5795, -74.1502],
  "St. George": [40.6433, -74.0735],
};

// Borough groupings for organized neighborhood filter
const BOROUGH_NEIGHBORHOODS: { borough: string; neighborhoods: string[] }[] = [
  {
    borough: "Manhattan",
    neighborhoods: [
      "Battery Park City", "Chelsea", "East Harlem", "East Village",
      "Financial District", "Harlem", "Lower East Side", "Manhattan",
      "Midtown", "Midtown East", "Murray Hill", "Roosevelt Island",
      "SoHo", "Tribeca", "Upper East Side", "Upper West Side",
      "Washington Heights", "West Village",
    ],
  },
  {
    borough: "Brooklyn",
    neighborhoods: [
      "Bath Beach", "Bay Ridge", "Bedford-Stuyvesant", "Bensonhurst",
      "Boerum Hill", "Borough Park", "Brighton Beach", "Brooklyn",
      "Brooklyn Heights", "Brownsville", "Bushwick", "Canarsie",
      "Clinton Hill", "Cobble Hill", "Columbia Street Waterfront District",
      "Coney Island", "Crown Heights", "Downtown Brooklyn", "Dumbo",
      "Dyker Heights", "East Flatbush", "Fort Greene", "Fort Hamilton",
      "Gravesend", "Greenpoint", "Kensington", "Mapleton", "Marine Park",
      "Midwood", "Park Slope", "Prospect Lefferts Gardens", "Sheepshead Bay",
      "South Slope", "Stuyvesant Heights", "Sunset Park", "Williamsburg",
    ],
  },
  {
    borough: "Queens",
    neighborhoods: [
      "Arverne", "Astoria", "Bayside", "Broad Channel", "Corona",
      "Douglaston", "East Elmhurst", "Elmhurst", "Far Rockaway",
      "Flushing", "Forest Hills", "Fresh Meadows", "Glendale",
      "Hollis Hills", "Howard Beach", "Jamaica", "Kew Gardens",
      "Long Island City", "Ozone Park", "Queens Village", "Rego Park",
      "Richmond Hill", "Ridgewood", "Rockaway Beach", "Rockaway Park",
      "Rosedale", "South Ozone Park", "St. Albans", "Sunnyside",
      "Woodhaven", "Woodside",
    ],
  },
  {
    borough: "Bronx",
    neighborhoods: [
      "Belmont", "Concourse", "East Bronx", "Fordham Heights",
      "Fordham Manor", "Melrose", "Morris Heights", "Port Morris",
      "University Heights", "West Bronx",
    ],
  },
  {
    borough: "Staten Island",
    neighborhoods: [
      "Arden Heights", "Bay Terrace", "Dongan Hills", "Eltingville",
      "Fort Wadsworth", "Great Kills", "Lighthouse Hill", "Mid Island",
      "Midland Beach", "New Dorp", "New Dorp Beach", "Port Richmond",
      "Richmond", "Rosebank", "Seaside", "Stapleton Heights", "Staten Island",
    ],
  },
];

function findNearestNeighborhood(lat: number, lng: number, available: string[]): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const name of available) {
    const coords = NEIGHBORHOOD_COORDS[name];
    if (!coords) continue;
    const dlat = lat - coords[0];
    const dlng = lng - coords[1];
    const dist = dlat * dlat + dlng * dlng;
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}

interface Restaurant {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  num_reviews: number;
  total_score: number;
  review_count: number;
  url: string;
  p_safe_pick: number;
  rank: number;
  signal_score: number;
  image_url: string;
  price_midpoint?: number;
  is_open_now?: boolean | null;
  [key: string]: unknown;
}

interface ApiResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  neighborhoods: string[];
  cuisines: string[];
  results: Restaurant[];
}

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const neighborhood = searchParams.get("neighborhood") ?? "";
  const cuisine = searchParams.get("cuisine") ?? "";
  const price = searchParams.get("price") ?? "";
  const search = searchParams.get("search") ?? "";
  const openNow = searchParams.get("open_now") === "1";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);
  const [locating, setLocating] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filtersExpanded, setFiltersExpanded] = useState(!!(neighborhood || cuisine || price || openNow));
  const activeFilterCount = [neighborhood, cuisine, price, openNow ? "open" : ""].filter(Boolean).length;
  const filterSummary = [neighborhood, cuisine, price, openNow ? "Open now" : ""].filter(Boolean).join(" · ");

  useEffect(() => {
    Promise.all([
      fetch("/api/saved").then((r) => r.json()).catch(() => ({ ids: [] })),
      fetch("/api/liked").then((r) => r.json()).catch(() => ({ ids: [] })),
    ]).then(([saved, liked]) => {
      setSavedIds(new Set(saved.ids ?? []));
      setLikedIds(new Set(liked.ids ?? []));
    });
  }, []);

  function handleNearMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestNeighborhood(
          pos.coords.latitude,
          pos.coords.longitude,
          allNeighborhoods
        );
        setLocating(false);
        if (nearest) {
          updateParams({ neighborhood: nearest });
        }
      },
      () => {
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (neighborhood) params.set("neighborhood", neighborhood);
      if (cuisine) params.set("cuisine", cuisine);
      if (price) params.set("price", price);
      if (search) params.set("search", search);
      if (openNow) params.set("open_now", "true");
      params.set("page", String(page));
      params.set("page_size", "20");

      const res = await fetch(`${API_BASE}/api/recommendations?${params.toString()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }, [neighborhood, cuisine, price, search, openNow, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (!("page" in updates)) {
      params.set("page", "1");
    }
    router.push(`/recommendations?${params.toString()}`);
  }

  const allNeighborhoods = data?.neighborhoods ?? [];
  const allCuisines = data?.cuisines ?? [];
  const restaurants = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>
          Locals
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/recommendations" className="text-xs sm:text-sm font-medium" style={{ color: "var(--text)" }}>
            Recs
          </Link>
          <Link href="/favorites" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Saved
          </Link>
          <Link href="/visited" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Visited
          </Link>
          <Link href="/about" className="hidden sm:inline text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            About
          </Link>
          <UserMenu />
        </nav>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display text-3xl mb-1" style={{ color: "var(--text)" }}>
            Recommendations
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {!loading
              ? `${total} spot${total !== 1 ? "s" : ""}${neighborhood ? ` in ${neighborhood}` : ""}${cuisine ? ` · ${cuisine}` : ""} — ranked by local reviews, not tourist traffic`
              : "Ranked by local reviews, not tourist traffic"}
          </p>
        </div>

        {/* Search bar — always visible */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="search-restaurants" className="sr-only">Search restaurants</label>
            <div className="relative w-full sm:w-80">
              <input
                id="search-restaurants"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateParams({ search: searchInput });
                  }
                }}
                placeholder="Search restaurants..."
                className="search-input w-full rounded-lg pl-4 pr-10 py-2.5 text-sm"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  outline: "none",
                }}
              />
              <button
                onClick={() => updateParams({ search: searchInput })}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-75"
                aria-label="Search"
                style={{ color: "var(--text-muted)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </div>
            {search && (
              <button
                onClick={() => {
                  setSearchInput("");
                  updateParams({ search: "" });
                }}
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => setFiltersExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--accent)", color: "#fff", lineHeight: 1.4 }}
              >
                {activeFilterCount}
              </span>
            )}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.2s", transform: filtersExpanded ? "rotate(180deg)" : "none" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {activeFilterCount > 0 && !filtersExpanded && (
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{filterSummary}</p>
          )}
        </div>

        {/* Collapsible filter panel */}
        <div className={`filter-expand${filtersExpanded ? " open" : ""} mb-10`}>
          <div className="filter-expand-inner">
            <div className="flex flex-col sm:flex-row gap-3 pt-3 pb-1">
              <div className="flex gap-2 w-full sm:w-auto">
                <label htmlFor="filter-neighborhood" className="sr-only">Filter by neighborhood</label>
                <select
                  id="filter-neighborhood"
                  value={neighborhood}
                  onChange={(e) => updateParams({ neighborhood: e.target.value })}
                  className="filter-control flex-1 sm:flex-none rounded-lg px-3 py-3 sm:py-2 text-sm font-medium cursor-pointer"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    outline: "none",
                  }}
                >
                  <option value="" style={{ backgroundColor: "var(--bg-card)" }}>
                    All neighborhoods
                  </option>
                  {BOROUGH_NEIGHBORHOODS.map((group) => {
                    const available = group.neighborhoods.filter((n) => allNeighborhoods.includes(n));
                    if (available.length === 0) return null;
                    return (
                      <optgroup key={group.borough} label={group.borough} style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", fontWeight: 600 }}>
                        {available.map((n) => (
                          <option key={n} value={n} style={{ backgroundColor: "var(--bg-card)", color: "var(--text)", fontWeight: 400 }}>
                            {n}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <button
                  onClick={handleNearMe}
                  disabled={locating}
                  className="filter-control px-3.5 py-3 sm:py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {locating ? "Locating..." : "Near Me"}
                </button>
              </div>

              <label htmlFor="filter-cuisine" className="sr-only">Filter by cuisine</label>
              <select
                id="filter-cuisine"
                value={cuisine}
                onChange={(e) => updateParams({ cuisine: e.target.value })}
                className="filter-control w-full sm:w-auto rounded-lg px-3 py-3 sm:py-2 text-sm font-medium cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  outline: "none",
                }}
              >
                <option value="" style={{ backgroundColor: "var(--bg-card)" }}>
                  All cuisines
                </option>
                {allCuisines.map((c) => (
                  <option key={c} value={c} style={{ backgroundColor: "var(--bg-card)" }}>
                    {c}
                  </option>
                ))}
              </select>
              <label htmlFor="filter-price" className="sr-only">Filter by price</label>
              <select
                id="filter-price"
                value={price}
                onChange={(e) => updateParams({ price: e.target.value })}
                className="filter-control w-full sm:w-auto rounded-lg px-3 py-3 sm:py-2 text-sm font-medium cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  outline: "none",
                }}
              >
                <option value="" style={{ backgroundColor: "var(--bg-card)" }}>All prices</option>
                <option value="$" style={{ backgroundColor: "var(--bg-card)" }}>$ (under $15)</option>
                <option value="$$" style={{ backgroundColor: "var(--bg-card)" }}>$$ ($15-30)</option>
                <option value="$$$" style={{ backgroundColor: "var(--bg-card)" }}>$$$ ($30-60)</option>
                <option value="$$$$" style={{ backgroundColor: "var(--bg-card)" }}>$$$$ ($60+)</option>
              </select>
              <button
                onClick={() => updateParams({ open_now: openNow ? "" : "1" })}
                aria-pressed={openNow}
                className="filter-control w-full sm:w-auto rounded-lg px-3 py-3 sm:py-2 text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: openNow ? "var(--success)" : "var(--bg-subtle)",
                  color: openNow ? "#ffffff" : "var(--text-secondary)",
                  border: `1px solid ${openNow ? "var(--success)" : "var(--border)"}`,
                }}
              >
                Open Now
              </button>
            </div>
          </div>
        </div>

        {/* Loading — skeleton cards */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}
              >
                <div className="skeleton h-52 sm:h-48" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "var(--accent-soft)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
              {/\d{3}/.test(error ?? "") || (error ?? "").includes("API error") ? "Having trouble loading restaurants — please try again." : error}
            </p>
            <button
              onClick={fetchData}
              className="mt-3 text-xs font-medium underline"
              style={{ color: "var(--text-muted)" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Restaurant grid */}
        {!loading && !error && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {restaurants.map((r, i) => {
              const isFeatured = i === 0 && page === 1;
              return (
                <div key={r.restaurant_id} className={`card-enter${isFeatured ? " md:col-span-2" : ""}`} style={{ animationDelay: `${i * 50}ms` }}>
                  <RestaurantCard
                    restaurantId={r.restaurant_id}
                    rank={r.rank}
                    name={r.name}
                    neighborhood={r.neighborhood}
                    cuisine={r.cuisine}
                    reviews={r.review_count ?? r.num_reviews ?? 0}
                    rating={r.total_score ?? 0}
                    mapsUrl={r.url}
                    photoUrl={r.image_url}
                    price={r.price_midpoint ? (r.price_midpoint <= 15 ? "$" : r.price_midpoint <= 30 ? "$$" : r.price_midpoint <= 60 ? "$$$" : "$$$$") : undefined}
                    isOpenNow={r.is_open_now}
                    initialSaved={savedIds.has(r.restaurant_id)}
                    initialLiked={likedIds.has(r.restaurant_id)}
                    featured={isFeatured}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && restaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>
              Nothing here yet
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Try a different neighborhood, cuisine, or search term
            </p>
            <button
              onClick={() => {
                setSearchInput("");
                router.push("/recommendations");
              }}
              className="text-sm font-medium"
              style={{ color: "var(--accent-text)" }}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-4">
            {(() => {
              const prevParams = new URLSearchParams(searchParams.toString());
              prevParams.set("page", String(page - 1));
              const nextParams = new URLSearchParams(searchParams.toString());
              nextParams.set("page", String(page + 1));
              return (
                <>
                  <Link
                    href={page <= 1 ? "#" : `/recommendations?${prevParams.toString()}`}
                    aria-disabled={page <= 1}
                    className="page-btn px-6 py-3 sm:px-4 sm:py-2 rounded-lg text-sm font-medium min-w-[44px] min-h-[44px]"
                    style={{
                      backgroundColor: "var(--bg-subtle)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      opacity: page <= 1 ? 0.3 : 1,
                      pointerEvents: page <= 1 ? "none" : "auto",
                    }}
                  >
                    Prev
                  </Link>

                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {page} of {totalPages}
                  </span>

                  <Link
                    href={page >= totalPages ? "#" : `/recommendations?${nextParams.toString()}`}
                    aria-disabled={page >= totalPages}
                    className="page-btn px-6 py-3 sm:px-4 sm:py-2 rounded-lg text-sm font-medium min-w-[44px] min-h-[44px]"
                    style={{
                      backgroundColor: "var(--bg-subtle)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      opacity: page >= totalPages ? 0.3 : 1,
                      pointerEvents: page >= totalPages ? "none" : "auto",
                    }}
                  >
                    Next
                  </Link>
                </>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--bg)", color: "var(--text-muted)" }}
        >
          Loading...
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
