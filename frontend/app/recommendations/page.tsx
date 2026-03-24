"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import RestaurantCard from "@/components/RestaurantCard";

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
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (neighborhood) params.set("neighborhood", neighborhood);
      if (cuisine) params.set("cuisine", cuisine);
      if (search) params.set("search", search);
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
  }, [neighborhood, cuisine, search, page]);

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
    // Reset to page 1 when filters change (unless explicitly setting page)
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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#111111", color: "#f1f5f9" }}
    >
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: "rgba(17,17,17,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(241,245,249,0.08)",
        }}
      >
        <Link href="/" className="font-bold text-lg" style={{ color: "#f1f5f9" }}>
          🍜 Locals
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm transition-colors hover:opacity-75"
            style={{ color: "rgba(241,245,249,0.55)" }}
          >
            Home
          </Link>
          <Link
            href="/recommendations"
            className="text-sm font-medium"
            style={{ color: "#f1f5f9" }}
          >
            Recommendations
          </Link>
          <Link
            href="/about"
            className="text-sm transition-colors hover:opacity-75"
            style={{ color: "rgba(241,245,249,0.55)" }}
          >
            About
          </Link>
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#f1f5f9" }}>
            NYC Restaurant Recommendations
          </h1>
          {!loading && (
            <p className="text-sm" style={{ color: "rgba(241,245,249,0.55)" }}>
              {total} local-approved spots
              {neighborhood ? ` in ${neighborhood}` : ""}
              {cuisine ? ` · ${cuisine}` : ""}
            </p>
          )}
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParams({ search: searchInput });
              }
            }}
            placeholder="Search restaurants..."
            className="w-full sm:w-80 rounded-xl px-4 py-2.5 text-sm"
            style={{
              backgroundColor: "rgba(241,245,249,0.08)",
              color: "#f1f5f9",
              border: "1px solid rgba(241,245,249,0.12)",
              outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => {
                setSearchInput("");
                updateParams({ search: "" });
              }}
              className="ml-2 text-xs underline"
              style={{ color: "rgba(241,245,249,0.55)" }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Neighborhood pills — horizontal scroll */}
          <div className="flex-1 overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => updateParams({ neighborhood: "", cuisine })}
                className={`px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${!neighborhood ? "neighborhood-pill-active" : "neighborhood-pill"}`}
                style={
                  !neighborhood
                    ? { backgroundColor: "#ff385c", color: "#ffffff" }
                    : {
                        backgroundColor: "rgba(241,245,249,0.08)",
                        color: "rgba(241,245,249,0.75)",
                        border: "1px solid rgba(241,245,249,0.12)",
                      }
                }
              >
                All
              </button>
              {allNeighborhoods.map((n) => (
                <button
                  key={n}
                  onClick={() => updateParams({ neighborhood: n })}
                  className={`px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${neighborhood === n ? "neighborhood-pill-active" : "neighborhood-pill"}`}
                  style={
                    neighborhood === n
                      ? { backgroundColor: "#ff385c", color: "#ffffff" }
                      : {
                          backgroundColor: "rgba(241,245,249,0.08)",
                          color: "rgba(241,245,249,0.75)",
                          border: "1px solid rgba(241,245,249,0.12)",
                        }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine dropdown */}
          <div className="shrink-0">
            <select
              value={cuisine}
              onChange={(e) => updateParams({ cuisine: e.target.value })}
              className="rounded-xl px-3 py-2.5 sm:py-2 text-sm font-medium cursor-pointer"
              style={{
                backgroundColor: "rgba(241,245,249,0.08)",
                color: "#f1f5f9",
                border: "1px solid rgba(241,245,249,0.12)",
                outline: "none",
              }}
            >
              <option value="" style={{ backgroundColor: "#1a1a1a" }}>
                All cuisines
              </option>
              {allCuisines.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: "#1a1a1a" }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div
              className="text-sm"
              style={{ color: "rgba(241,245,249,0.55)" }}
            >
              Loading restaurants...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              backgroundColor: "rgba(255,56,92,0.10)",
              border: "1px solid rgba(255,56,92,0.25)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "#ff385c" }}>
              {error}
            </p>
            <button
              onClick={fetchData}
              className="mt-3 text-xs underline"
              style={{ color: "rgba(241,245,249,0.55)" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Restaurant grid */}
        {!loading && !error && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {restaurants.map((r) => (
              <RestaurantCard
                key={r.restaurant_id}
                restaurantId={r.restaurant_id}
                rank={r.rank}
                name={r.name}
                neighborhood={r.neighborhood}
                cuisine={r.cuisine}
                reviews={r.review_count ?? r.num_reviews ?? 0}
                rating={r.total_score ?? 0}
                mapsUrl={r.url}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && restaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">🍽️</div>
            <p className="font-medium mb-1" style={{ color: "#f1f5f9" }}>
              No restaurants found
            </p>
            <p className="text-sm" style={{ color: "rgba(241,245,249,0.55)" }}>
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 1}
              className="page-btn px-5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-sm font-medium disabled:opacity-30"
              style={{
                backgroundColor: "rgba(241,245,249,0.08)",
                color: "#f1f5f9",
                border: "1px solid rgba(241,245,249,0.12)",
              }}
            >
              ← Prev
            </button>

            <span className="text-sm" style={{ color: "rgba(241,245,249,0.55)" }}>
              Page <strong style={{ color: "#f1f5f9" }}>{page}</strong> of{" "}
              <strong style={{ color: "#f1f5f9" }}>{totalPages}</strong>
            </span>

            <button
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="page-btn px-5 py-2.5 sm:px-4 sm:py-2 rounded-xl text-sm font-medium disabled:opacity-30"
              style={{
                backgroundColor: "rgba(241,245,249,0.08)",
                color: "#f1f5f9",
                border: "1px solid rgba(241,245,249,0.12)",
              }}
            >
              Next →
            </button>
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
          style={{ backgroundColor: "#111111", color: "rgba(241,245,249,0.55)" }}
        >
          Loading...
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
