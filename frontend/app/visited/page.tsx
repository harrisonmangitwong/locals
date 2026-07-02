"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RestaurantCard from "@/components/RestaurantCard";
import UserMenu from "@/components/UserMenu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getLiked(): Promise<string[]> {
  try {
    const res = await fetch("/api/liked");
    const data = await res.json();
    return data.ids ?? [];
  } catch {
    return [];
  }
}

async function getReactions(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/reactions");
    const data = await res.json();
    return data.reactions ?? {};
  } catch {
    return {};
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
  [key: string]: unknown;
}

export default function VisitedPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function load() {
      const [ids, rxns] = await Promise.all([getLiked(), getReactions()]);
      setReactions(rxns);
      if (ids.length === 0) {
        setEmpty(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/restaurants/batch?ids=${ids.join(",")}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setRestaurants(json.results);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
              {restaurants.length} place{restaurants.length !== 1 ? "s" : ""}{" "}you&apos;ve visited
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
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
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
              After you&apos;ve been somewhere, tap the heart on the restaurant. We&apos;ll keep track.
            </p>
            <Link
              href="/recommendations"
              className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              Browse restaurants
            </Link>
          </div>
        )}

        {/* Visited grid */}
        {!loading && !fetchError && !empty && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((r, i) => (
              <div key={r.restaurant_id} className="card-enter" style={{ animationDelay: `${i * 50}ms` }}>
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
                  initialLiked={true}
                  initialReaction={reactions[r.restaurant_id] ?? null}
                  promptReaction={!reactions[r.restaurant_id]}
                  onUnlike={(id) =>
                    setRestaurants((prev) => prev.filter((x) => x.restaurant_id !== id))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
