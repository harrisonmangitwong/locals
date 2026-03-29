"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CUISINE_PHOTO_MAP: Record<string, string> = {
  Ramen: "photo-1569050467447-ce54b3bbc37d",
  Japanese: "photo-1553621042-f6e147245754",
  Pizza: "photo-1513104890138-7c749659a591",
  Italian: "photo-1555396273-367ea4eb4db5",
  Chinese: "photo-1563245372-f21724e3856d",
  Korean: "photo-1614563637806-1d0e645e0940",
  Mexican: "photo-1565299585323-38d6b0865b47",
  Indian: "photo-1585937421612-70a008356fbe",
  Mediterranean: "photo-1544025162-d76694265947",
  "Middle Eastern": "photo-1561626423-a51b45aef0a1",
  Thai: "photo-1562565652-a0d8f0c59eb4",
  American: "photo-1550317138-10000687a72b",
  Deli: "photo-1509722747041-616f39b57569",
  Seafood: "photo-1565680018434-b513d5e5fd47",
  French: "photo-1414235077428-338989a2e8c0",
  Halal: "photo-1561626423-a51b45aef0a1",
  Restaurant: "photo-1466978913421-dad2ebd01d17",
};
const DEFAULT_PHOTO = "photo-1504674900247-0877df9cc836";

interface RestaurantDetail {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  address: string;
  url: string;
  image_url: string;
  total_score: number;
  review_count: number;
  num_reviews: number;
  rank: number;
  signal_score: number;
  avg_localness: number;
  pct_local_reviews: number;
  pct_tourist_reviews: number;
  local_weighted_rating: number;
  tourist_weighted_rating: number;
  adjusted_score: number;
  p_safe_pick: number;
  archetype: string;
  [key: string]: unknown;
}

function RatingBar({ label, value, maxValue = 5 }: { label: string; value: number; maxValue?: number }) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-inset)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }} />
      </div>
      <span className="text-sm font-semibold w-8 text-right" style={{ color: "var(--text)" }}>{value.toFixed(1)}</span>
    </div>
  );
}

function getVerdict(localRating: number, touristRating: number): { text: string; color: string } {
  const gap = localRating - touristRating;
  if (gap > 0.3) {
    return { text: "Locals rate this higher than tourists — a hidden gem.", color: "#2d8a56" };
  } else if (gap < -0.3) {
    return { text: "Tourists rate this higher than locals — but locals still approve.", color: "var(--accent-text)" };
  } else {
    return { text: "Locals and tourists agree — this place is universally loved.", color: "var(--text-secondary)" };
  }
}

function SignalMeter({ value }: { value: number }) {
  const pct = Math.min(value * 100, 100);
  let strength: string;
  let color: string;
  if (pct >= 40) { strength = "Strong"; color = "#2d8a56"; }
  else if (pct >= 25) { strength = "Moderate"; color = "var(--accent-text)"; }
  else { strength = "Limited"; color = "var(--text-muted)"; }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Local signal strength</span>
        <span className="text-xs font-medium" style={{ color }}>{strength}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-inset)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
        Based on {pct.toFixed(0)}% average reviewer localness
      </p>
    </div>
  );
}

export default function RestaurantPage() {
  const params = useParams();
  const id = params.id as string;
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/restaurant/${id}`);
        if (!res.ok) throw new Error(`Not found (${res.status})`);
        const data = await res.json();
        setRestaurant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4" style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>Locals</Link>
        </header>
        <div className="w-full h-56 sm:h-72 animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="space-y-3 pt-4">
            <div className="h-8 w-2/3 rounded animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            <div className="h-4 w-1/2 rounded animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            <div className="h-4 w-1/3 rounded animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <p style={{ color: "var(--accent)" }}>{error ?? "Restaurant not found"}</p>
        <Link href="/recommendations" className="text-sm underline" style={{ color: "var(--text-muted)" }}>
          Back to recommendations
        </Link>
      </div>
    );
  }

  const r = restaurant;
  const fallbackId = CUISINE_PHOTO_MAP[r.cuisine] ?? DEFAULT_PHOTO;
  const photoUrl = r.image_url || `https://images.unsplash.com/${fallbackId}?w=800&q=75&auto=format&fit=crop`;

  const stars = Math.round(r.total_score * 2) / 2;
  const fullStars = Math.floor(stars);
  const hasHalf = stars - fullStars >= 0.5;

  function renderDetailStars() {
    const els: React.ReactNode[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        els.push(<span key={i} style={{ color: "var(--star-fill)" }}>&#9733;</span>);
      } else if (i === fullStars + 1 && hasHalf) {
        els.push(
          <span key={i} className="relative inline-block" style={{ color: "var(--star-empty)" }}>
            &#9733;
            <span className="absolute inset-0 overflow-hidden" style={{ width: "50%", color: "var(--star-fill)" }}>&#9733;</span>
          </span>
        );
      } else {
        els.push(<span key={i} style={{ color: "var(--star-empty)" }}>&#9733;</span>);
      }
    }
    return els;
  }

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
        <nav className="flex items-center gap-6">
          <Link href="/recommendations" className="text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Recommendations
          </Link>
          <Link href="/favorites" className="text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            Favorites
          </Link>
          <Link href="/about" className="text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
            About
          </Link>
        </nav>
      </header>

      {/* Hero image */}
      <div className="relative w-full h-56 sm:h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={r.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg), transparent 60%)" }} />
        <span
          className="absolute top-4 left-4 text-sm font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
        >
          #{r.rank}
        </span>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        {/* Name + basics */}
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl mb-3">{r.name}</h1>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            {r.neighborhood} · {r.cuisine} · {(r.review_count ?? r.num_reviews ?? 0).toLocaleString()} reviews
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ letterSpacing: "1px" }}>{renderDetailStars()}</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {r.total_score.toFixed(1)}
            </span>
          </div>
          {r.address && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{r.address}</p>
          )}
        </div>

        {/* Why it's local-approved */}
        <section className="mb-8">
          <h2 className="font-display text-xl mb-4" style={{ color: "var(--accent-text)" }}>
            Why it&apos;s local-approved
          </h2>

          {/* Rating comparison bars */}
          <div
            className="rounded-xl p-5 mb-4 space-y-3"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}
          >
            <RatingBar label="Locals" value={r.local_weighted_rating ?? 0} />
            <RatingBar label="Tourists" value={r.tourist_weighted_rating ?? 0} />
          </div>

          {/* Verdict sentence */}
          {(() => {
            const verdict = getVerdict(r.local_weighted_rating ?? 0, r.tourist_weighted_rating ?? 0);
            return (
              <p className="text-sm font-medium mb-5" style={{ color: verdict.color }}>
                {verdict.text}
              </p>
            );
          })()}

          {/* Signal strength meter */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}
          >
            <SignalMeter value={r.avg_localness ?? 0} />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pb-12">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          >
            Open in Google Maps
          </a>
          <Link
            href="/recommendations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-75"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            Back
          </Link>
        </div>
      </main>
    </div>
  );
}
