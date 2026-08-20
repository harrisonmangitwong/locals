"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RestaurantCard from "@/components/RestaurantCard";
import UserMenu from "@/components/UserMenu";
import { BUCKETS, type Bucket, type Tag } from "@/lib/ranking";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface RatingRow {
  restaurant_id: string;
  bucket: Bucket;
  rank_position: number;
  score: number;
  tags: Tag[];
}

async function getRatings(): Promise<RatingRow[]> {
  try {
    const res = await fetch("/api/ratings");
    const data = await res.json();
    return data.ratings ?? [];
  } catch {
    return [];
  }
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
  rank: number;
  image_url: string;
  price_midpoint: number | null;
  archetype?: string | null;
  [key: string]: unknown;
}

export default function VisitedPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingRow>>({});
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [followedSaveCounts, setFollowedSaveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const ratingRows = await getRatings();
      if (ratingRows.length === 0) {
        setEmpty(true);
        setLoading(false);
        return;
      }
      const byId: Record<string, RatingRow> = {};
      for (const r of ratingRows) byId[r.restaurant_id] = r;
      setRatings(byId);

      const ids = ratingRows.map((r) => r.restaurant_id);
      try {
        const res = await fetch(
          `${API_BASE}/api/restaurants/batch?ids=${ids.join(",")}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setRestaurants(json.results);
        fetch(`/api/follow-save-counts?ids=${ids.join(",")}`)
          .then((r) => r.json())
          .then((d) => setFollowedSaveCounts(d.counts ?? {}))
          .catch(() => {});
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function bucketGroup(bucket: Bucket): Restaurant[] {
    return restaurants
      .filter((r) => ratings[r.restaurant_id]?.bucket === bucket)
      .sort((a, b) => ratings[a.restaurant_id].rank_position - ratings[b.restaurant_id].rank_position);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/"
          className="font-display text-xl"
          style={{ color: "var(--text)" }}
        >
          Locals
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/recommendations"
            className="text-xs sm:text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            Recs
          </Link>
          <Link
            href="/favorites"
            className="text-xs sm:text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            Saved
          </Link>
          <Link
            href="/visited"
            className="text-xs sm:text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            Visited
          </Link>
          <Link
            href="/about"
            className="hidden sm:inline text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            About
          </Link>
          <UserMenu />
        </nav>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1
            className="font-display text-3xl mb-1"
            style={{ color: "var(--text)" }}
          >
            Visited
          </h1>
          {!loading && !empty && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {restaurants.length} place{restaurants.length !== 1 ? "s" : ""} you&apos;ve ranked
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="skeleton h-52 sm:h-48" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>
              Couldn&apos;t load your visited spots
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Something went wrong fetching your list. Try refreshing.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && empty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p
              className="font-display text-xl mb-2"
              style={{ color: "var(--text)" }}
            >
              Nothing visited yet
            </p>
            <p
              className="text-sm mb-6 max-w-md"
              style={{ color: "var(--text-muted)" }}
            >
              After you&apos;ve been somewhere, tap the heart on the restaurant to rank it. We&apos;ll keep track.
            </p>
            <Link
              href="/recommendations"
              className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
            >
              Browse restaurants
            </Link>
          </div>
        )}

        {/* Ranked sections, grouped by bucket */}
        {!loading && !fetchError && !empty && restaurants.length > 0 && (
          <div className="space-y-10">
            {BUCKETS.map(({ key, label }) => {
              const group = bucketGroup(key);
              if (group.length === 0) return null;
              return (
                <section key={key}>
                  <h2 className="font-display text-xl mb-4" style={{ color: "var(--text)" }}>
                    {label} <span style={{ color: "var(--text-muted)" }}>({group.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.map((r, i) => {
                      const rating = ratings[r.restaurant_id];
                      return (
                        <div key={r.restaurant_id} className="card-enter" style={{ animationDelay: `${i * 50}ms` }}>
                          <RestaurantCard
                            restaurantId={r.restaurant_id}
                            rank={r.rank}
                            rankOverride={rating.rank_position}
                            name={r.name}
                            neighborhood={r.neighborhood}
                            cuisine={r.cuisine}
                            reviews={r.review_count ?? r.num_reviews ?? 0}
                            rating={r.total_score ?? 0}
                            mapsUrl={r.url}
                            photoUrl={r.image_url}
                            archetype={r.archetype}
                            price={
                              r.price_midpoint
                                ? r.price_midpoint <= 15
                                  ? "$"
                                  : r.price_midpoint <= 30
                                    ? "$$"
                                    : r.price_midpoint <= 60
                                      ? "$$$"
                                      : "$$$$"
                                : undefined
                            }
                            initialBucket={rating.bucket}
                            ratingScore={rating.score}
                            ratingTags={rating.tags}
                            followedSaveCount={followedSaveCounts[r.restaurant_id]}
                            onRated={(id, bucket) =>
                              setRatings((prev) => ({ ...prev, [id]: { ...prev[id], bucket } }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
