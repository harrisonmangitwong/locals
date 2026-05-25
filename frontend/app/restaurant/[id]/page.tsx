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

interface HoursEntry { day: string; hours: string }
interface ReviewEntry { text: string; rating: number; author: string; published?: string }

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
  phone?: string;
  website?: string;
  opening_hours?: string;
  extra_image_urls?: string;
  top_reviews?: string;
  is_open_now?: boolean | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RatingBar({ label, value, maxValue = 5, color }: { label: string; value: number; maxValue?: number; color?: string }) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-inset)" }}>
        <div className="bar-fill h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color ?? "var(--accent)" }} />
      </div>
      <span className="text-sm font-semibold w-8 text-right" style={{ color: "var(--text)" }}>{value.toFixed(1)}</span>
    </div>
  );
}

function getVerdict(localRating: number, touristRating: number): { text: string; color: string } {
  const gap = localRating - touristRating;
  if (gap > 0.3) return { text: "Locals rate this higher than tourists — a hidden gem.", color: "var(--success)" };
  if (gap < -0.3) return { text: "Tourists rate this higher than locals — but locals still approve.", color: "var(--accent-text)" };
  return { text: "Locals and tourists agree — this place is universally loved.", color: "var(--text-secondary)" };
}

function SignalMeter({ value }: { value: number }) {
  const pct = Math.min(value * 100, 100);
  let strength: string, color: string;
  if (pct >= 40) { strength = "Strong"; color = "var(--success)"; }
  else if (pct >= 25) { strength = "Moderate"; color = "var(--accent-text)"; }
  else { strength = "Limited"; color = "var(--text-muted)"; }
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Local signal strength</span>
        <span className="text-xs font-medium" style={{ color }}>{strength}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-inset)" }}>
        <div className="bar-fill h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
        Based on {pct.toFixed(0)}% average reviewer localness
      </p>
    </div>
  );
}

function MiniStars({ rating }: { rating: number }) {
  const stars = Math.round(rating * 2) / 2;
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <span key={i} style={{ color: "var(--star-fill)", fontSize: 13 }}>&#9733;</span>;
        if (i === full && half) return (
          <span key={i} className="relative inline-block" style={{ color: "var(--star-empty)", fontSize: 13 }}>
            &#9733;
            <span className="absolute inset-0 overflow-hidden" style={{ width: "50%", color: "var(--star-fill)" }}>&#9733;</span>
          </span>
        );
        return <span key={i} style={{ color: "var(--star-empty)", fontSize: 13 }}>&#9733;</span>;
      })}
    </span>
  );
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function HoursTable({ hoursJson, isOpenNow }: { hoursJson: string; isOpenNow?: boolean | null }) {
  const [expanded, setExpanded] = useState(false);
  let entries: HoursEntry[] = [];
  try { entries = JSON.parse(hoursJson); } catch { return null; }
  if (!entries.length) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
  const todayEntry = entries.find(e => e.day === today);

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-2 text-sm font-medium w-full text-left"
        style={{ color: "var(--text)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: isOpenNow === true ? "var(--success)" : isOpenNow === false ? "var(--accent)" : "var(--text-secondary)" }}>
          {isOpenNow === true ? "Open now" : isOpenNow === false ? "Closed now" : "Hours"}
        </span>
        {todayEntry && (
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            · {todayEntry.hours}
          </span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ marginLeft: "auto", color: "var(--text-muted)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={`hours-body${expanded ? " open" : ""}`}>
        <div className="hours-body-inner">
          <div className="mt-2 space-y-1">
            {DAYS_ORDER.map(day => {
              const entry = entries.find(e => e.day === day);
              if (!entry) return null;
              const isToday = day === today;
              return (
                <div key={day} className="flex justify-between text-xs" style={{ fontWeight: isToday ? 600 : 400, color: isToday ? "var(--text)" : "var(--text-muted)" }}>
                  <span style={{ width: 100 }}>{day}</span>
                  <span>{entry.hours}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoGallery({ imageUrls, name }: { imageUrls: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  if (imageUrls.length === 0) return null;
  const prev = () => setIdx(i => (i - 1 + imageUrls.length) % imageUrls.length);
  const next = () => setIdx(i => (i + 1) % imageUrls.length);
  return (
    <div>
      <h2 className="font-display text-xl mb-3" style={{ color: "var(--accent-text)" }}>Photos</h2>
      <div className="relative rounded-xl overflow-hidden" style={{ height: 220 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrls[idx]} alt={`${name} photo ${idx + 1}`} className="w-full h-full" style={{ objectFit: "cover" }} loading="lazy" />
        {imageUrls.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", color: "#fff" }} aria-label="Previous photo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", color: "#fff" }} aria-label="Next photo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {imageUrls.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className="rounded-full transition-all" style={{ width: i === idx ? 16 : 6, height: 6, backgroundColor: i === idx ? "#fff" : "rgba(255,255,255,0.5)" }} aria-label={`Photo ${i + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewEntry }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{review.author}</span>
        <MiniStars rating={review.rating ?? 5} />
      </div>
      <p className="text-[0.9375rem] leading-relaxed" style={{ color: "var(--text)" }}>{review.text}</p>
      {review.published && <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{review.published}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Favorites helpers
// ---------------------------------------------------------------------------

function getFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("locals_favorites");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  if (favs.has(id)) { favs.delete(id); } else { favs.add(id); }
  localStorage.setItem("locals_favorites", JSON.stringify([...favs]));
  return favs.has(id);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RestaurantPage() {
  const params = useParams();
  const id = params.id as string;
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hearted, setHearted] = useState(false);
  const [heartPop, setHeartPop] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/restaurant/${id}`);
        if (!res.ok) throw new Error(`Not found (${res.status})`);
        const data = await res.json();
        setRestaurant(data);
        setHearted(getFavorites().has(data.restaurant_id));
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
        <div className="skeleton w-full h-56 sm:h-72" />
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="space-y-3 pt-4">
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <p style={{ color: "var(--accent)" }}>{error ?? "Restaurant not found"}</p>
        <Link href="/recommendations" className="text-sm underline" style={{ color: "var(--text-muted)" }}>Back to recommendations</Link>
      </div>
    );
  }

  const r = restaurant;
  const fallbackId = CUISINE_PHOTO_MAP[r.cuisine] ?? DEFAULT_PHOTO;
  const heroUrl = `https://images.unsplash.com/${fallbackId}?w=1200&q=80&auto=format&fit=crop`;

  const allPhotos: string[] = [];

  let reviews: ReviewEntry[] = [];
  if (r.top_reviews) {
    try { reviews = JSON.parse(r.top_reviews as string); } catch { /* ignore */ }
  }

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

  const verdict = getVerdict(r.local_weighted_rating ?? 0, r.tourist_weighted_rating ?? 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4" style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>Locals</Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/recommendations" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Recs</Link>
          <Link href="/favorites" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Saved</Link>
          <Link href="/visited" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Been Here</Link>
          <Link href="/about" className="hidden sm:inline text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>About</Link>
        </nav>
      </header>

      {/* Hero image */}
      <div className="relative w-full h-56 sm:h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroUrl} alt={r.name} className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg), transparent 60%)" }} />
        <span className="absolute top-4 left-4 text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
          #{r.rank}
        </span>
        <button
          onClick={() => {
            const now = toggleFavorite(r.restaurant_id);
            setHearted(now);
            if (now) { setHeartPop(true); setTimeout(() => setHeartPop(false), 400); }
          }}
          className={`heart-btn absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full${heartPop ? " heart-pop" : ""}`}
          style={{ backgroundColor: hearted ? "var(--accent)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          aria-label={hearted ? "Remove from favorites" : "Save to favorites"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
            fill={hearted ? "#ffffff" : "none"} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        {/* Name + basics */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl mb-2.5">{r.name}</h1>
          <p className="text-sm mb-2.5" style={{ color: "var(--text-secondary)" }}>
            {r.neighborhood} · {r.cuisine} · {(r.review_count ?? r.num_reviews ?? 0).toLocaleString()} reviews
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ letterSpacing: "1px" }} role="img" aria-label={`Rating: ${r.total_score.toFixed(1)} out of 5 stars`}>{renderDetailStars()}</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{r.total_score.toFixed(1)}</span>
          </div>

          {/* Contact + hours */}
          <div className="space-y-2.5">
            {r.address && (
              <div className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{r.address}</span>
              </div>
            )}
            {r.phone && (
              <div className="flex items-center gap-2 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <a href={`tel:${r.phone}`} className="transition-opacity hover:opacity-75" style={{ color: "var(--text-secondary)" }}>{r.phone}</a>
              </div>
            )}
            {r.website && (
              <div className="flex items-center gap-2 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <a href={r.website} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-75 truncate max-w-xs" style={{ color: "var(--accent-text)" }}>
                  {r.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}
            {r.opening_hours && (
              <HoursTable hoursJson={r.opening_hours as string} isOpenNow={r.is_open_now as boolean | null} />
            )}
          </div>
        </div>

        {/* Photo gallery */}
        {allPhotos.length > 1 && (
          <div className="mb-8">
            <PhotoGallery imageUrls={allPhotos} name={r.name} />
          </div>
        )}

        {/* Why it's local-approved */}
        <section className="mb-10">
          <h2 className="font-display text-xl mb-3" style={{ color: "var(--success)" }}>Why it&apos;s local-approved</h2>
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "var(--success-soft)", border: "1px solid var(--border)" }}>
            <div className="space-y-3">
              <RatingBar label="Locals" value={r.local_weighted_rating ?? 0} color="var(--success)" />
              <RatingBar label="Tourists" value={r.tourist_weighted_rating ?? 0} />
            </div>
            <p className="text-sm font-medium" style={{ color: verdict.color }}>{verdict.text}</p>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <SignalMeter value={r.avg_localness ?? 0} />
          </div>
        </section>

        {/* What locals are saying */}
        {reviews.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-xl mb-4" style={{ color: "var(--accent-text)" }}>What locals are saying</h2>
            <div className="space-y-3">
              {reviews.map((rev, i) => <ReviewCard key={i} review={rev} />)}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-12">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="cta-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
            Open in Google Maps
          </a>
          <Link href="/recommendations" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-75" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)" }}>
            Back
          </Link>
        </div>
      </main>
    </div>
  );
}
