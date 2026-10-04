"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import SignInPrompt from "@/components/SignInPrompt";
import { getPhotoUrl, pickHeroPhoto } from "@/lib/photoFallback";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { Bucket } from "@/lib/ranking";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface HoursEntry { day: string; hours: string }

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
  avg_localness: number;
  local_weighted_rating: number;
  tourist_weighted_rating: number;
  phone?: string;
  website?: string;
  opening_hours?: string;
  top_reviews?: string;
  extra_image_urls?: string;
  is_open_now?: boolean | null;
  price_midpoint?: number | null;
  archetype?: string | null;
  [key: string]: unknown;
}

interface ReviewQuote {
  text: string;
  rating: number;
  author: string;
  published: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priceLabel(mid: number | null | undefined): string | null {
  if (!mid) return null;
  if (mid <= 15) return "$";
  if (mid <= 30) return "$$";
  if (mid <= 60) return "$$$";
  return "$$$$";
}

function getVerdict(localRating: number, touristRating: number): string {
  const gap = localRating - touristRating;
  if (gap > 0.5) return `Locals rate it ${localRating.toFixed(1)} vs. tourists' ${touristRating.toFixed(1)} — regulars love it more than visitors do.`;
  if (gap > 0.3) return `Locals give it ${localRating.toFixed(1)} — noticeably higher than tourists' ${touristRating.toFixed(1)}. A neighborhood favorite.`;
  if (gap < -0.3) return `Tourists give it ${touristRating.toFixed(1)}, locals ${localRating.toFixed(1)} — popular with visitors, but locals still rate it well.`;
  return `Locals (${localRating.toFixed(1)}) and tourists (${touristRating.toFixed(1)}) agree — this place holds up across the board.`;
}

function friendlyDetailError(err: string | null): string {
  if (!err) return "Restaurant not found.";
  if (err.includes("404")) return "We couldn't find this restaurant.";
  return "Something went wrong — try going back and refreshing.";
}

function parseTopReviews(json: string | undefined): ReviewQuote[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => typeof r?.text === "string" && r.text.trim().length > 0)
      .slice(0, 3);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MiniStars({ rating }: { rating: number }) {
  const stars = Math.round(rating * 2) / 2;
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
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

function getTodayEntry(hoursJson: string | undefined): HoursEntry | null {
  if (!hoursJson) return null;
  try {
    const entries: HoursEntry[] = JSON.parse(hoursJson);
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
    return entries.find(e => e.day === today) ?? null;
  } catch {
    return null;
  }
}

function WeeklyHours({ hoursJson }: { hoursJson: string }) {
  let entries: HoursEntry[] = [];
  try { entries = JSON.parse(hoursJson); } catch { return null; }
  if (!entries.length) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });

  return (
    <div className="space-y-1">
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
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface SimilarRestaurant {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  total_score: number;
  rank: number;
  image_url: string;
}

export default function RestaurantPage() {
  const params = useParams();
  const id = params.id as string;
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [savePop, setSavePop] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [similar, setSimilar] = useState<SimilarRestaurant[]>([]);
  const { user } = useCurrentUser();
  const [signInReason, setSignInReason] = useState<string | null>(null);
  const [heroTier, setHeroTier] = useState(0);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch(`${API_BASE}/api/restaurant/${id}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setRestaurant(data);
        setHeroTier(0);

        // Fetch similar restaurants once we have neighborhood + cuisine
        try {
          const params = new URLSearchParams({ neighborhood: data.neighborhood, cuisine: data.cuisine, page_size: "6" });
          const simRes = await fetch(`${API_BASE}/api/recommendations?${params}`);
          if (simRes.ok) {
            const simData = await simRes.json();
            const filtered = (simData.results as SimilarRestaurant[])
              .filter((r) => r.restaurant_id !== id)
              .slice(0, 3);
            setSimilar(filtered);
          }
        } catch { /* non-critical */ }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    async function loadSaved() {
      try {
        const res = await fetch("/api/saved");
        const data = await res.json();
        setSaved((data.ids ?? []).includes(id));
      } catch { /* ignore */ }
    }
    async function loadRating() {
      try {
        const res = await fetch(`/api/ratings?restaurant_id=${id}`);
        const data = await res.json();
        setBucket(data.ratings?.[0]?.bucket ?? null);
      } catch { /* ignore */ }
    }
    loadRestaurant();
    loadSaved();
    loadRating();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4" style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>Locals</Link>
        </header>
        <div className="skeleton w-full" style={{ height: "clamp(260px, 40vw, 420px)" }} />
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-8 space-y-3">
          <div className="skeleton h-7 w-2/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <SiteHeader />
        <div id="main-content" className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-xl" style={{ color: "var(--text)" }}>{friendlyDetailError(error)}</p>
          <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
            It may have moved, or the link might be out of date.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link href="/recommendations" className="cta-btn inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold">
              Browse recommendations
            </Link>
            <Link href="/" className="text-sm transition-opacity hover:opacity-75 active:opacity-60" style={{ color: "var(--text-muted)" }}>
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const r = restaurant;
  // Tiered so a pixelated hero never happens silently: prefer the real,
  // full-resolution Google photo; fall back to the small mirrored copy,
  // then the cuisine stock photo, only if each prior tier fails to load.
  const heroCandidates = [
    pickHeroPhoto(r.image_url, r.extra_image_urls as string | undefined),
    r.image_url,
    getPhotoUrl(r.cuisine, 1200, 80),
  ].filter((u): u is string => !!u);
  const heroUrl = heroCandidates[Math.min(heroTier, heroCandidates.length - 1)];

  const price = priceLabel(r.price_midpoint);
  const verdictText = getVerdict(r.local_weighted_rating ?? 0, r.tourist_weighted_rating ?? 0);
  const hasMoreDetails = !!(r.phone || r.website || r.opening_hours);
  const reviews = parseTopReviews(r.top_reviews as string | undefined);
  const todayEntry = getTodayEntry(r.opening_hours as string | undefined);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>

      {/* Header */}
      <SiteHeader />

      {/* Hero -- the real photo's native resolution (~400px wide) can't cover
          this full-bleed width without visibly pixelating, so a soft blur
          disguises the upscale as a deliberate stylistic choice instead of
          a technical defect. Still the one real photo of this restaurant,
          no stock or AI-generated imagery. Blur scales with viewport width
          because the upscale factor does too (barely any at mobile widths
          close to the source's native ~400px, much more on a wide desktop
          hero) -- a fixed blur amount looked right on mobile but left
          visible blockiness on wider screens. */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(260px, 40vw, 420px)", backgroundColor: "var(--bg-inset)" }}>
        <Image
          src={heroUrl}
          alt={r.name}
          fill
          sizes="100vw"
          className="object-cover"
          style={{ filter: "blur(clamp(4px, 1.3vw, 24px))", transform: "scale(1.1)" }}
          priority
          onError={() => setHeroTier((t) => Math.min(t + 1, heroCandidates.length - 1))}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.1) 75%, transparent 100%)" }} />

        {/* Rank badge */}
        <span
          className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#241f18" }}
          title="Overall rank across all NYC restaurants, weighted by local ratings"
        >
          #{r.rank}
        </span>

        {/* Bookmark + confirmation -- hidden once visited/rated, since saved
            and visited are mutually exclusive */}
        {!bucket && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {showSavedMsg && (
              <span
                className="save-confirm-pill text-xs font-semibold px-2 py-0.5 rounded-full"
                onAnimationEnd={() => setShowSavedMsg(false)}
                style={{ backgroundColor: "var(--success-strong)", color: "#fff", backdropFilter: "blur(4px)" }}
              >
                Saved
              </span>
            )}
            {showSaveError && (
              <span
                className="save-confirm-pill text-xs font-semibold px-2 py-0.5 rounded-full"
                onAnimationEnd={() => setShowSaveError(false)}
                style={{ backgroundColor: "var(--accent)", color: "#241f18", backdropFilter: "blur(4px)" }}
              >
                Couldn&apos;t save — try again
              </span>
            )}
            <button
              onClick={() => {
                if (!user) {
                  setSignInReason("Sign in to save restaurants");
                  return;
                }
                const nowSaved = !saved;
                setSaved(nowSaved);
                if (nowSaved) { setSavePop(true); setTimeout(() => setSavePop(false), 400); setShowSavedMsg(true); }
                fetch("/api/saved", {
                  method: nowSaved ? "POST" : "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ restaurant_id: r.restaurant_id }),
                }).then((res) => {
                  if (!res.ok) { setSaved(saved); setShowSaveError(true); }
                }).catch(() => { setSaved(saved); setShowSaveError(true); });
              }}
              className={`heart-btn flex items-center justify-center w-11 h-11 rounded-full${savePop ? " heart-pop" : ""}`}
              style={{ backgroundColor: saved ? "var(--accent)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
              aria-label={saved ? "Remove from saved" : "Save restaurant"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15"
                fill={saved ? "#241f18" : "none"} stroke={saved ? "#241f18" : "#ffffff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* Name + meta overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{r.neighborhood}</span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{r.cuisine}</span>
            {price && (
              <>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{price}</span>
              </>
            )}
            {r.is_open_now === true && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--success-strong)", color: "#ffffff", backdropFilter: "blur(4px)" }}>Open</span>
            )}
            {r.is_open_now === false && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#ffffff", backdropFilter: "blur(4px)" }}>Closed</span>
            )}
          </div>
          {r.archetype && (
            <span
              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5"
              style={{ backgroundColor: "var(--accent)", color: "#241f18" }}
              title="A real, computed signal from reviewer-localness scoring across this restaurant's reviews — not a decorative label"
            >
              {r.archetype}
            </span>
          )}
          <h1 className="font-display text-2xl sm:text-3xl leading-tight line-clamp-2" style={{ color: "#ffffff" }}>{r.name}</h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <MiniStars rating={r.total_score} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{r.total_score.toFixed(1)}</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>({(r.review_count ?? r.num_reviews ?? 0).toLocaleString()} reviews)</span>
          </div>
        </div>
      </div>

      {/* Quick facts: address + today's hours, surfaced immediately */}
      {r.address && (
        <div
          className="w-full flex flex-col gap-1.5 px-4 sm:px-6 py-3.5"
          style={{ backgroundColor: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="max-w-2xl mx-auto w-full flex items-center gap-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: "var(--text-muted)" }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="flex-1 text-sm truncate" style={{ color: "var(--text)" }}>{r.address}</span>
          </div>
          {todayEntry && (
            <div className="max-w-2xl mx-auto w-full flex items-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: r.is_open_now === true ? "var(--success-strong)" : "var(--text-muted)" }}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: r.is_open_now === true ? "var(--success-strong)" : "var(--text-muted)" }}>
                {r.is_open_now === true ? "Open" : r.is_open_now === false ? "Closed" : "Hours"} · {todayEntry.hours}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* The local take */}
        <section>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "var(--text)" }}>The local take</h2>

          <p className="text-base leading-relaxed mb-5" style={{ color: "var(--text)" }}>{verdictText}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <div
                className="bar-fill h-full rounded-full"
                style={{
                  width: `${Math.round((r.avg_localness ?? 0) * 100)}%`,
                  backgroundColor: "var(--success)",
                  animationDelay: "150ms",
                }}
              />
            </div>
            <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
              {Math.round((r.avg_localness ?? 0) * 100)}% NYC locals
            </span>
          </div>
        </section>

        {/* What locals are saying */}
        {reviews.length > 0 && (
          <section style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}>
            <h2 className="font-semibold text-lg mb-5" style={{ color: "var(--text)" }}>What locals are saying</h2>
            <div className="space-y-5">
              {reviews.map((rev, i) => (
                <blockquote key={i}>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>&ldquo;{rev.text}&rdquo;</p>
                  <footer className="flex items-center gap-2 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <MiniStars rating={rev.rating} />
                    <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{rev.author}</span>
                    <span>·</span>
                    <span>{rev.published}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* More in neighborhood */}
        {similar.length > 0 && (
          <section style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}>
            <h2 className="font-semibold text-lg mb-5" style={{ color: "var(--text)" }}>
              More in {r.neighborhood}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {similar.map((s) => (
                <Link key={s.restaurant_id} href={`/restaurant/${s.restaurant_id}`} className="group flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                  <div className="relative overflow-hidden h-24">
                    <Image
                      src={s.image_url || getPhotoUrl(s.cuisine)}
                      alt={s.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      loading="lazy"
                    />
                    <span
                      className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--accent)", color: "#241f18" }}
                      title="Overall rank across all NYC restaurants, weighted by local ratings"
                    >
                      #{s.rank}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>{s.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.total_score.toFixed(1)} · {s.cuisine}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* See full hours (+ phone/website) */}
        {hasMoreDetails && (
          <section style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}>
            <button
              onClick={() => setDetailsOpen(v => !v)}
              className="flex items-center justify-between w-full text-left transition-opacity hover:opacity-70 active:opacity-55"
              aria-expanded={detailsOpen}
            >
              <h2 className="font-semibold text-lg" style={{ color: "var(--text)" }}>See full hours</h2>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ color: "var(--text-muted)", transform: detailsOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div className={`filter-expand${detailsOpen ? " open" : ""}`}>
              <div className="filter-expand-inner">
                <div className="pt-4 space-y-3">
                  {r.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: "var(--text-muted)" }}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <a href={`tel:${r.phone}`} className="transition-opacity hover:opacity-75 active:opacity-60" style={{ color: "var(--text-secondary)" }}>{r.phone}</a>
                    </div>
                  )}
                  {r.website && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: "var(--text-muted)" }}>
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      <a href={r.website} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-75 active:opacity-60 truncate max-w-xs" style={{ color: "var(--accent-text)" }}>
                        {r.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  )}
                  {r.opening_hours && (
                    <WeeklyHours hoursJson={r.opening_hours as string} />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Get directions + Share */}
        <div className="pt-2 pb-8 flex items-center gap-3 flex-wrap">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Get directions
          </a>
          <button
            onClick={() => {
              const url = window.location.href;
              const text = `Check out ${r.name} on Locals — ranked #${r.rank}, locals rate it ${(r.local_weighted_rating ?? 0).toFixed(1)} vs. tourists' ${(r.tourist_weighted_rating ?? 0).toFixed(1)}.`;
              if (navigator.share) {
                navigator.share({ title: r.name, text, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${text} ${url}`).catch(() => {});
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold cursor-pointer transition-all duration-150 hover:opacity-75 active:scale-95 min-h-[44px]"
            style={{ border: "1px solid var(--border-strong)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
          <Link href="/recommendations" className="text-sm transition-opacity hover:opacity-75 active:opacity-60 ml-auto min-h-[44px] flex items-center" style={{ color: "var(--text-muted)" }}>
            ← Back
          </Link>
        </div>

      </main>

      <SignInPrompt
        open={signInReason !== null}
        reason={signInReason ?? ""}
        onClose={() => setSignInReason(null)}
      />
    </div>
  );
}
