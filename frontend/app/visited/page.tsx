"use client";

import { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import BrowseRow, { RowsSkeleton, rowCandidate } from "@/components/BrowseRow";
import ScrollSpotlight from "@/components/ScrollSpotlight";
import SiteHeader from "@/components/SiteHeader";
import LockedState from "@/components/LockedState";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useCurrentUser } from "@/lib/useCurrentUser";
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
  [key: string]: unknown;
}

export default function VisitedPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingRow>>({});
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [followedSaveCounts, setFollowedSaveCounts] = useState<Record<string, number>>({});
  const { user, loading: authLoading } = useCurrentUser();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
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
  }, [authLoading, user]);

  function bucketGroup(bucket: Bucket): Restaurant[] {
    return restaurants
      .filter((r) => ratings[r.restaurant_id]?.bucket === bucket)
      .sort((a, b) => ratings[a.restaurant_id].rank_position - ratings[b.restaurant_id].rank_position);
  }

  const hasList = !loading && !fetchError && !empty && restaurants.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader current="visited" />

      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-14">
        <div className="mb-7">
          <h1 className="font-display text-[34px] md:text-[44px]">Visited</h1>
          {user && hasList && (
            <p className="text-[15px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
              Your places, ranked by you
            </p>
          )}
        </div>

        {!authLoading && !user && (
          <LockedState
            heading="Sign in to see where you've been"
            body="Rate the places you've been and build your own ranked list."
            cta={<GoogleSignInButton />}
          />
        )}

        {(authLoading || user) && loading && <RowsSkeleton count={4} />}

        {user && !loading && fetchError && (
          <LockedState
            heading="Couldn't load your places"
            body="Check your connection and try again."
            cta={<button onClick={() => window.location.reload()} className="soft-btn px-6 text-[15px]">Try again</button>}
          />
        )}

        {user && !loading && !fetchError && empty && (
          <LockedState
            heading="Nowhere yet"
            body="After you've been somewhere, tap the check on it to rate it. Your list builds itself from there."
            cta={<Link href="/recommendations" className="cta-btn inline-flex items-center justify-center px-7 text-[15px]">Browse all places</Link>}
          />
        )}

        {/* One section per verdict, best first; inside each, your own order. */}
        {hasList && (
          <ScrollSpotlight watch={restaurants.map((r) => `${r.restaurant_id}:${ratings[r.restaurant_id]?.bucket}`).join(",")} className="flex flex-col gap-10">
            {BUCKETS.map(({ key, label }) => {
              const group = bucketGroup(key);
              if (group.length === 0) return null;
              return (
                <section key={key} aria-labelledby={`bucket-${key}`}>
                  <h2 id={`bucket-${key}`} className="text-[21px] font-semibold tracking-[-0.015em] mb-4">
                    {label} <span className="font-normal tabular-nums" style={{ color: "var(--text-muted)" }}>{group.length}</span>
                  </h2>
                  <ul className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                    {group.map((r, i) => {
                      const rating = ratings[r.restaurant_id];
                      return (
                        <li key={r.restaurant_id} className="rise" style={{ "--i": Math.min(i, 7) } as CSSProperties}>
                          <BrowseRow
                            c={rowCandidate(r)}
                            rank={rating.rank_position}
                            initialBucket={rating.bucket}
                            ratingScore={rating.score}
                            ratingTags={rating.tags}
                            followedSaveCount={followedSaveCounts[r.restaurant_id]}
                            onRated={(id, bucket) => setRatings((prev) => ({ ...prev, [id]: { ...prev[id], bucket } }))}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </ScrollSpotlight>
        )}
      </main>
    </div>
  );
}
