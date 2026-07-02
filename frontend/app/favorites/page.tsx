"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RestaurantCard from "@/components/RestaurantCard";
import UserMenu from "@/components/UserMenu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getSaved(): Promise<string[]> {
  try {
    const res = await fetch("/api/saved");
    const data = await res.json();
    return data.ids ?? [];
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
  [key: string]: unknown;
}

export default function FavoritesPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setUserId(d.id ?? null)).catch(() => {});
  }, []);

  function handleShareList() {
    if (!userId) return;
    const url = `${window.location.origin}/list/${userId}`;
    if (navigator.share) {
      navigator.share({ title: "My NYC picks on Locals", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }

  useEffect(() => {
    async function load() {
      const ids = await getSaved();
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
            className="text-xs sm:text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            Saved
          </Link>
          <Link
            href="/visited"
            className="text-xs sm:text-sm transition-colors hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1
              className="font-display text-3xl mb-1"
              style={{ color: "var(--text)" }}
            >
              Saved
            </h1>
            {!loading && !empty && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {restaurants.length} saved spot{restaurants.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {!loading && !empty && userId && (
            <button
              onClick={handleShareList}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-75 min-h-[44px]"
              style={{ border: "1px solid var(--border-strong)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {copied ? "Link copied!" : "Share my list"}
            </button>
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
              Couldn&apos;t load your saved spots
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
              Nothing saved yet
            </p>
            <p
              className="text-sm mb-6 max-w-md"
              style={{ color: "var(--text-muted)" }}
            >
              When a spot catches your eye, hit the bookmark. It&apos;ll be waiting here when you&apos;re ready.
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

        {/* Favorites grid */}
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
                initialSaved={true}
                onUnsave={(id) =>
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
