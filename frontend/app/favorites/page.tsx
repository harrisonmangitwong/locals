"use client";

import { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import BrowseRow, { RowsSkeleton, rowCandidate } from "@/components/BrowseRow";
import Icon from "@/components/Icon";
import ScrollSpotlight from "@/components/ScrollSpotlight";
import SiteHeader from "@/components/SiteHeader";
import LockedState from "@/components/LockedState";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { Bucket } from "@/lib/ranking";

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
  const { user, loading: authLoading } = useCurrentUser();
  const [copied, setCopied] = useState(false);
  const [ratings, setRatings] = useState<Record<string, Bucket>>({});
  const [followedSaveCounts, setFollowedSaveCounts] = useState<Record<string, number>>({});
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/ratings").then((r) => r.json()).then((d) => {
      const map: Record<string, Bucket> = {};
      for (const r of d.ratings ?? []) map[r.restaurant_id] = r.bucket;
      setRatings(map);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile").then((r) => r.json()).then((d) => setUsername(d.username ?? null)).catch(() => {});
  }, [user]);

  function handleShareList() {
    if (!user) return;
    const url = `${window.location.origin}${username ? `/u/${username}` : `/list/${user.id}`}`;
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
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
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

  // Saved and visited/rated are mutually exclusive -- once something's
  // rated it drops out of Saved, live (via the ratings map updating from
  // onRated below) and for any legacy rows from before that rule existed.
  const visibleRestaurants = restaurants.filter((r) => !ratings[r.restaurant_id]);
  const showEmptyState = !loading && !fetchError && (empty || visibleRestaurants.length === 0);

  const hasList = !loading && !fetchError && !showEmptyState && visibleRestaurants.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader current="saved" />

      <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-14">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div className="min-w-0">
            <h1 className="font-display text-[34px] md:text-[44px]">Saved</h1>
            {user && hasList && (
              <p className="text-[15px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
                Places you want to try
              </p>
            )}
          </div>
          {user && hasList && (
            <button onClick={handleShareList} className="soft-btn inline-flex items-center justify-center gap-2 px-5 text-[15px] shrink-0">
              <Icon name="share" size={16} />
              {copied ? "Link copied" : "Share list"}
            </button>
          )}
        </div>

        {!authLoading && !user && (
          <LockedState
            heading="Sign in to see your saved places"
            body="Save places as you browse and they'll wait here until you're ready."
            cta={<GoogleSignInButton />}
          />
        )}

        {(authLoading || user) && loading && <RowsSkeleton count={4} />}

        {user && !loading && fetchError && (
          <LockedState
            heading="Couldn't load your saved places"
            body="Check your connection and try again."
            cta={<button onClick={() => window.location.reload()} className="soft-btn px-6 text-[15px]">Try again</button>}
          />
        )}

        {user && showEmptyState && (
          <LockedState
            heading="Nothing saved yet"
            body="When a place catches your eye, tap the bookmark. It'll be waiting here."
            cta={<Link href="/recommendations" className="cta-btn inline-flex items-center justify-center px-7 text-[15px]">Browse all places</Link>}
          />
        )}

        {hasList && (
          <ScrollSpotlight watch={visibleRestaurants.map((r) => r.restaurant_id).join(",")}>
            <ul className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              {visibleRestaurants.map((r, i) => (
                <li key={r.restaurant_id} className="rise" style={{ "--i": Math.min(i, 7) } as CSSProperties}>
                  <BrowseRow
                    c={rowCandidate(r)}
                    initialSaved
                    initialBucket={ratings[r.restaurant_id] ?? null}
                    followedSaveCount={followedSaveCounts[r.restaurant_id]}
                    onRated={(id, bucket) => setRatings((prev) => ({ ...prev, [id]: bucket }))}
                    onUnsave={(id) => setRestaurants((prev) => prev.filter((x) => x.restaurant_id !== id))}
                  />
                </li>
              ))}
            </ul>
          </ScrollSpotlight>
        )}
      </main>
    </div>
  );
}
