"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

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
  is_open_now?: boolean | null;
  price_midpoint?: number | null;
  [key: string]: unknown;
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
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {todayEntry.hours}</span>
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
  const [savePop, setSavePop] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [similar, setSimilar] = useState<SimilarRestaurant[]>([]);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch(`${API_BASE}/api/restaurant/${id}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setRestaurant(data);

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
    loadRestaurant();
    loadSaved();
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <p style={{ color: "var(--accent)" }}>{friendlyDetailError(error)}</p>
        <Link href="/recommendations" className="text-sm underline" style={{ color: "var(--text-muted)" }}>Back to recommendations</Link>
      </div>
    );
  }

  const r = restaurant;
  const fallbackId = CUISINE_PHOTO_MAP[r.cuisine] ?? DEFAULT_PHOTO;
  const heroUrl = r.image_url || `https://images.unsplash.com/${fallbackId}?w=1200&q=80&auto=format&fit=crop`;

  const price = priceLabel(r.price_midpoint);
  const verdictText = getVerdict(r.local_weighted_rating ?? 0, r.tourist_weighted_rating ?? 0);
  const hasDetails = !!(r.address || r.phone || r.website || r.opening_hours);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4" style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>Locals</Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/recommendations" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Recs</Link>
          <Link href="/favorites" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Saved</Link>
          <Link href="/visited" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Visited</Link>
          <Link href="/about" className="hidden sm:inline text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>About</Link>
          <UserMenu />
        </nav>
      </header>

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(260px, 40vw, 420px)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroUrl} alt={r.name} className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.1) 75%, transparent 100%)" }} />

        {/* Rank badge */}
        <span className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
          #{r.rank}
        </span>

        {/* Bookmark + confirmation */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {showSavedMsg && (
            <span
              className="save-confirm-pill text-xs font-semibold px-2 py-0.5 rounded-full"
              onAnimationEnd={() => setShowSavedMsg(false)}
              style={{ backgroundColor: "var(--success)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              Saved
            </span>
          )}
          <button
            onClick={() => {
              const nowSaved = !saved;
              setSaved(nowSaved);
              if (nowSaved) { setSavePop(true); setTimeout(() => setSavePop(false), 400); setShowSavedMsg(true); }
              fetch("/api/saved", {
                method: nowSaved ? "POST" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restaurant_id: r.restaurant_id }),
              }).catch(() => setSaved(saved));
            }}
            className={`heart-btn flex items-center justify-center w-11 h-11 rounded-full${savePop ? " heart-pop" : ""}`}
            style={{ backgroundColor: saved ? "var(--accent)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            aria-label={saved ? "Remove from saved" : "Save restaurant"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15"
              fill={saved ? "#ffffff" : "none"} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

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
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)" }}>Open</span>
            )}
            {r.is_open_now === false && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.45)" }}>Closed</span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl leading-tight" style={{ color: "#ffffff" }}>{r.name}</h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <MiniStars rating={r.total_score} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{r.total_score.toFixed(1)}</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>({(r.review_count ?? r.num_reviews ?? 0).toLocaleString()} reviews)</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* The local take */}
        <section>
          <h2 className="font-display text-xl mb-3" style={{ color: "var(--text)" }}>The local take</h2>
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

        {/* More in neighborhood */}
        {similar.length > 0 && (
          <section style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}>
            <h2 className="font-display text-xl mb-5" style={{ color: "var(--text)" }}>
              More in {r.neighborhood}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {similar.map((s) => (
                <Link key={s.restaurant_id} href={`/restaurant/${s.restaurant_id}`} className="group flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                  <div className="relative overflow-hidden h-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image_url || `https://images.unsplash.com/${CUISINE_PHOTO_MAP[s.cuisine] ?? DEFAULT_PHOTO}?w=400&q=65&auto=format&fit=crop`}
                      alt={s.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
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

        {/* Address & hours */}
        {hasDetails && (
          <section style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}>
            <button
              onClick={() => setDetailsOpen(v => !v)}
              className="flex items-center justify-between w-full text-left"
              aria-expanded={detailsOpen}
            >
              <h2 className="font-display text-xl" style={{ color: "var(--text)" }}>Address & hours</h2>
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
                  {r.address && (
                    <div className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{r.address}</span>
                    </div>
                  )}
                  {r.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: "var(--text-muted)" }}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <a href={`tel:${r.phone}`} className="transition-opacity hover:opacity-75" style={{ color: "var(--text-secondary)" }}>{r.phone}</a>
                    </div>
                  )}
                  {r.website && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: "var(--text-muted)" }}>
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
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
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
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
          <Link href="/recommendations" className="text-sm transition-opacity hover:opacity-75 ml-auto min-h-[44px] flex items-center" style={{ color: "var(--text-muted)" }}>
            ← Back
          </Link>
        </div>

      </main>
    </div>
  );
}
