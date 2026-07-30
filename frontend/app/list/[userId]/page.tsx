"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RestaurantCard from "@/components/RestaurantCard";

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

export default function PublicListPage() {
  const { userId } = useParams<{ userId: string }>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/public/saved?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.results || d.results.length === 0) setNotFound(true);
        setRestaurants(d.results ?? []);
        setOwnerName(d.name ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${ownerName ?? "Someone"}'s NYC picks on Locals`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>
          Locals
        </Link>
        <Link
          href="/recommendations"
          className="text-sm transition-colors hover:opacity-75"
          style={{ color: "var(--text-secondary)" }}
        >
          Browse restaurants →
        </Link>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                <div className="skeleton h-52 sm:h-48" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && notFound && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>
              No saved restaurants
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              This list is empty or doesn&apos;t exist.
            </p>
            <Link
              href="/recommendations"
              className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
            >
              Browse restaurants
            </Link>
          </div>
        )}

        {!loading && !notFound && (
          <>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl mb-1" style={{ color: "var(--text)" }}>
                  {ownerName ? `${ownerName}'s picks` : "Saved restaurants"}
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {restaurants.length} spot{restaurants.length !== 1 ? "s" : ""} saved on Locals
                </p>
              </div>
              <button
                onClick={handleShare}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-75 min-h-[44px]"
                style={{ border: "1px solid var(--border-strong)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share list
              </button>
            </div>

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
                    archetype={r.archetype}
                    price={
                      r.price_midpoint
                        ? r.price_midpoint <= 15 ? "$"
                        : r.price_midpoint <= 30 ? "$$"
                        : r.price_midpoint <= 60 ? "$$$"
                        : "$$$$"
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
