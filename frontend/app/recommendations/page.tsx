"use client";

import { type CSSProperties, type ReactNode, useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import BrowseRow, { RowsSkeleton, rowCandidate } from "@/components/BrowseRow";
import Icon from "@/components/Icon";
import ScrollSpotlight from "@/components/ScrollSpotlight";
import SiteHeader from "@/components/SiteHeader";
import RequestRestaurantForm from "@/components/RequestRestaurantForm";
import type { Bucket } from "@/lib/ranking";
import { BOROUGH_NEIGHBORHOODS } from "@/lib/boroughs";
import { findNearestNeighborhood } from "@/lib/neighborhoods";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  local_weighted_rating?: number;
  tourist_weighted_rating?: number;
  [key: string]: unknown;
}

// A filter that has many values (neighborhood, cuisine, price) as a chip:
// a native select dressed as a soft pill that flips to ink once set.
function SelectChip({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <span className="relative shrink-0 flex" style={{ color: value ? "var(--cta-text)" : "var(--text)" }}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`filter-pill appearance-none h-11 pl-4 pr-9 text-[15px] font-medium cursor-pointer max-w-[220px] truncate${value ? " is-active" : ""}`}
        style={{ colorScheme: "light dark", fieldSizing: "content" } as CSSProperties}
      >
        {children}
      </select>
      <Icon name="chevron-down" size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </span>
  );
}

const optionStyle: CSSProperties = { backgroundColor: "var(--bg-card)", color: "var(--text)" };

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
  const forYou = searchParams.get("for_you") === "1";

  const abortRef = useRef<AbortController | null>(null);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, Bucket>>({});
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});
  const [followedSaveCounts, setFollowedSaveCounts] = useState<Record<string, number>>({});
  const hasAnyFilter = !!(neighborhood || cuisine || price || openNow || search);
  const forYouEligible = savedIds.size + Object.keys(ratings).length >= 5;
  useEffect(() => {
    Promise.all([
      fetch("/api/saved").then((r) => r.json()).catch(() => ({ ids: [] })),
      fetch("/api/ratings").then((r) => r.json()).catch(() => ({ ratings: [] })),
    ]).then(([saved, ratingsRes]) => {
      setSavedIds(new Set(saved.ids ?? []));
      const map: Record<string, Bucket> = {};
      for (const r of ratingsRes.ratings ?? []) map[r.restaurant_id] = r.bucket;
      setRatings(map);
    });
  }, []);

  // Live search: debounce 350ms, only fire when input differs from current URL param
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => {
      updateParams({ search: searchInput });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNearMe() {
    if (!navigator.geolocation) {
      setLocationError("Location isn’t supported on this browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
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
        } else {
          setLocationError("Couldn’t match that to a neighborhood. Try picking one instead.");
        }
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location is turned off. Pick a neighborhood instead."
            : "Couldn’t get your location. Try again, or pick a neighborhood."
        );
      },
      { timeout: 10000 }
    );
  }

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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

      const url = forYou && forYouEligible
        ? `/api/recommendations/personalized?${params.toString()}`
        : `${API_BASE}/api/recommendations?${params.toString()}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);

      const ids = json.results.map((r) => r.restaurant_id).join(",");
      if (ids) {
        fetch(`/api/save-counts?ids=${ids}`)
          .then((r) => r.json())
          .then((d) => setSaveCounts(d.counts ?? {}))
          .catch(() => {});
        fetch(`/api/follow-save-counts?ids=${ids}`)
          .then((r) => r.json())
          .then((d) => setFollowedSaveCounts(d.counts ?? {}))
          .catch(() => {});
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [neighborhood, cuisine, price, search, openNow, page, forYou, forYouEligible]);

  useEffect(() => {
    fetchData();
    return () => { abortRef.current?.abort(); };
  }, [fetchData]);

  // The request-restaurant form only exists once the grid has rendered
  // (it's conditionally mounted below the results), so a plain #hash in the
  // URL is already gone by the time the browser would normally auto-scroll
  // to it on load -- scroll to it manually once loading finishes.
  useEffect(() => {
    if (loading || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

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
  const ids = restaurants.map((r) => r.restaurant_id).join(",");
  const pageHref = (n: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(n));
    return `/recommendations?${p.toString()}`;
  };
  function clearAll() {
    setSearchInput("");
    router.push("/recommendations");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader current="recs" />

      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-14">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[34px] md:text-[44px]">All places</h1>
            {/* A count only helps once you've narrowed the list. */}
            {data && hasAnyFilter && (
              <p className="text-[15px] mt-1.5 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {total.toLocaleString()} {total === 1 ? "match" : "matches"}
              </p>
            )}
          </div>
          <Link href="/pick" className="cta-btn hidden sm:inline-flex items-center justify-center px-7 text-[15px] shrink-0">
            Help me pick
          </Link>
        </div>

        {/* Search and filters stay in reach while the list scrolls. */}
        <div className="browse-toolbar sticky top-14 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-4 pb-3 mt-2">
          <div className="relative">
            <label htmlFor="search-restaurants" className="sr-only">Search restaurants</label>
            <Icon name="search" size={17} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-restaurants"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") updateParams({ search: searchInput }); }}
              placeholder="Search by name"
              className="search-field w-full h-11 rounded-full pl-11 pr-11 text-[15px]"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); updateParams({ search: "" }); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                aria-label="Clear search"
                style={{ color: "var(--text-secondary)" }}
              >
                <Icon name="x" size={16} />
              </button>
            )}
          </div>

          <div className="chip-scroll flex items-center gap-2 mt-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
            {forYouEligible && (
              <button
                onClick={() => updateParams({ for_you: forYou ? "" : "1" })}
                aria-pressed={forYou}
                className={`filter-pill shrink-0 h-11 px-4 text-[15px] font-medium${forYou ? " is-active" : ""}`}
              >
                For you
              </button>
            )}
            <button
              onClick={() => updateParams({ open_now: openNow ? "" : "1" })}
              aria-pressed={openNow}
              className={`filter-pill shrink-0 h-11 px-4 text-[15px] font-medium${openNow ? " is-active" : ""}`}
            >
              Open now
            </button>
            <button
              onClick={handleNearMe}
              disabled={locating}
              className="filter-pill shrink-0 h-11 px-4 text-[15px] font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Icon name="locate" size={15} />
              {locating ? "Locating…" : "Near me"}
            </button>
            <SelectChip id="filter-neighborhood" label="Filter by neighborhood" value={neighborhood} onChange={(v) => updateParams({ neighborhood: v })}>
              <option value="" style={optionStyle}>Neighborhood</option>
              {BOROUGH_NEIGHBORHOODS.map((group) => {
                const available = group.neighborhoods.filter((n) => allNeighborhoods.includes(n));
                if (available.length === 0) return null;
                return (
                  <optgroup key={group.borough} label={group.borough} style={optionStyle}>
                    {available.map((n) => <option key={n} value={n} style={optionStyle}>{n}</option>)}
                  </optgroup>
                );
              })}
            </SelectChip>
            <SelectChip id="filter-cuisine" label="Filter by cuisine" value={cuisine} onChange={(v) => updateParams({ cuisine: v })}>
              <option value="" style={optionStyle}>Cuisine</option>
              {allCuisines.map((c) => <option key={c} value={c} style={optionStyle}>{c}</option>)}
            </SelectChip>
            <SelectChip id="filter-price" label="Filter by price" value={price} onChange={(v) => updateParams({ price: v })}>
              <option value="" style={optionStyle}>Price</option>
              <option value="$" style={optionStyle}>$ · under $15</option>
              <option value="$$" style={optionStyle}>$$ · $15 to 30</option>
              <option value="$$$" style={optionStyle}>$$$ · $30 to 60</option>
              <option value="$$$$" style={optionStyle}>$$$$ · $60+</option>
            </SelectChip>
            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="shrink-0 h-11 px-3 text-[15px] font-medium inline-flex items-center gap-1 transition-opacity hover:opacity-70 fade-in"
                style={{ color: "var(--text-secondary)" }}
              >
                <Icon name="x" size={15} /> Clear
              </button>
            )}
          </div>
          {locationError && (
            <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>{locationError}</p>
          )}
        </div>

        {/* First load only: row skeletons. A later filter change keeps the
            current rows up, dimmed, so refining reads as "updating." */}
        {loading && !data && (
          <div className="mt-5"><RowsSkeleton count={8} /></div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center text-center py-20 gap-3">
            <p className="text-[17px] font-semibold">Couldn&rsquo;t load restaurants</p>
            <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>Check your connection and try again.</p>
            <button onClick={fetchData} className="soft-btn px-6 text-[15px] mt-2">Try again</button>
          </div>
        )}

        {/* Screen readers hear the result of a search or filter once it lands. */}
        <p className="sr-only" role="status">
          {!loading && !error && data ? (total === 0 ? "No places match." : `Showing ${total.toLocaleString()} ${total === 1 ? "place" : "places"}.`) : ""}
        </p>

        {!error && restaurants.length > 0 && (
          <ScrollSpotlight watch={ids}>
            <ul
              className="grid md:grid-cols-2 gap-x-10 gap-y-6 mt-5 transition-opacity duration-150"
              style={loading ? { opacity: 0.5, pointerEvents: "none" } : undefined}
            >
              {restaurants.map((r, i) => (
                <li key={r.restaurant_id} className="rise" style={{ "--i": Math.min(i, 7) } as CSSProperties}>
                  <BrowseRow
                    c={rowCandidate(r)}
                    isOpenNow={r.is_open_now}
                    initialSaved={savedIds.has(r.restaurant_id)}
                    initialBucket={ratings[r.restaurant_id] ?? null}
                    saveCount={saveCounts[r.restaurant_id]}
                    followedSaveCount={followedSaveCounts[r.restaurant_id]}
                    onRated={(id, bucket) => setRatings((prev) => ({ ...prev, [id]: bucket }))}
                  />
                </li>
              ))}
            </ul>
          </ScrollSpotlight>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <div className="flex flex-col items-center text-center py-20">
            <p className="text-[19px] font-semibold">Nothing matches that</p>
            <p className="text-[15px] mt-1.5 max-w-sm" style={{ color: "var(--text-secondary)" }}>
              Try removing a filter, or tell us about a place we should add.
            </p>
            <button onClick={clearAll} className="soft-btn px-6 text-[15px] mt-5">Clear filters</button>
            <div id="request-restaurant" className="mt-8">
              <RequestRestaurantForm />
            </div>
          </div>
        )}

        {!error && totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-3 mt-12 transition-opacity duration-150"
            style={loading ? { opacity: 0.5, pointerEvents: "none" } : undefined}
            aria-label="Pages"
          >
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="soft-btn inline-flex items-center gap-1.5 px-5 text-[15px]"><Icon name="arrow-left" size={16} />Previous</Link>
            ) : <span className="w-[118px]" aria-hidden="true" />}
            <span className="text-[14px] tabular-nums min-w-[72px] text-center" style={{ color: "var(--text-secondary)" }}>{page} of {totalPages}</span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="soft-btn inline-flex items-center gap-1.5 px-5 text-[15px]">Next<Icon name="arrow-right" size={16} /></Link>
            ) : <span className="w-[118px]" aria-hidden="true" />}
          </nav>
        )}

        {!error && restaurants.length > 0 && (
          <div id="request-restaurant" className="flex justify-center mt-10">
            <RequestRestaurantForm />
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
