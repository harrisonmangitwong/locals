"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import SignInPrompt from "@/components/SignInPrompt";
import Icon, { type IconName } from "@/components/Icon";
import ScrollSpotlight from "@/components/ScrollSpotlight";
import { type Candidate, PlaceRow } from "@/components/PickCard";
import { getPhotoUrl, pickHeroPhoto } from "@/lib/photoFallback";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { getVerdict } from "@/lib/verdict";
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
  review_themes?: string;
  is_open_now?: boolean | null;
  price_midpoint?: number | null;
  archetype?: string | null;
  [key: string]: unknown;
}

interface ReviewThemes {
  standout_dishes: string[];
  vibe_and_service: string[];
  wait_time_note: string | null;
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


// A 404 means the place isn't in Locals (an old link); anything else is a
// connection or server problem worth retrying.
function isNotFound(err: string | null) {
  return !!err && err.includes("404");
}

function parseReviewThemes(json: string | undefined): ReviewThemes | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    const dishes = Array.isArray(parsed?.standout_dishes) ? parsed.standout_dishes.filter((d: unknown) => typeof d === "string" && d.trim()) : [];
    const vibe = Array.isArray(parsed?.vibe_and_service) ? parsed.vibe_and_service.filter((v: unknown) => typeof v === "string" && v.trim()) : [];
    const waitNote = typeof parsed?.wait_time_note === "string" && parsed.wait_time_note.trim() ? parsed.wait_time_note : null;
    if (dishes.length === 0 && vibe.length === 0 && !waitNote) return null;
    return { standout_dishes: dishes, vibe_and_service: vibe, wait_time_note: waitNote };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function parseHours(hoursJson: string | undefined): HoursEntry[] {
  if (!hoursJson) return [];
  try {
    const entries = JSON.parse(hoursJson);
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function nycToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
}

// "Hidden Gem" -> "Hidden gem": the archetype reads as plain text, not a badge.
function sentenceCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function Fact({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <span className="flex items-start gap-2">
      <Icon name={icon} size={15} className="shrink-0 mt-[3px]" />
      <span className="min-w-0 tabular-nums">{children}</span>
    </span>
  );
}

// The rest of the neighborhood, as the same rows the homepage uses.
function toCandidate(s: SimilarRestaurant): Candidate {
  return {
    restaurant_id: s.restaurant_id,
    name: s.name,
    neighborhood: s.neighborhood,
    cuisine: s.cuisine,
    price_midpoint: s.price_midpoint ?? null,
    image_url: s.image_url || null,
    lat: 0,
    lng: 0,
    local_weighted_rating: s.local_weighted_rating ?? s.total_score,
    tourist_weighted_rating: s.tourist_weighted_rating ?? s.total_score,
    distance_mi: null,
    dishes: [],
    vibe: null,
    wait_note: null,
  };
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
  image_url: string;
  price_midpoint?: number | null;
  local_weighted_rating?: number;
  tourist_weighted_rating?: number;
}

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [savePop, setSavePop] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState<SimilarRestaurant[]>([]);
  const { user } = useCurrentUser();
  const [signInReason, setSignInReason] = useState<string | null>(null);
  const [heroTier, setHeroTier] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch(`${API_BASE}/api/restaurant/${id}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setRestaurant(data);
        setHeroTier(0);

        // The neighborhood's other top places, in ranked order.
        try {
          const params = new URLSearchParams({ neighborhood: data.neighborhood, page_size: "6" });
          const simRes = await fetch(`${API_BASE}/api/recommendations?${params}`);
          if (simRes.ok) {
            const simData = await simRes.json();
            const filtered = (simData.results as SimilarRestaurant[])
              .filter((r) => r.restaurant_id !== id)
              .slice(0, 4);
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
  }, [id, attempt]);

  function retry() {
    setError(null);
    setLoading(true);
    setAttempt((a) => a + 1);
  }

  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/recommendations");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
        <SiteHeader />
        <main id="main-content" className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-14 md:pt-[72px] grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6 md:gap-12" aria-busy="true" aria-label="Loading restaurant">
          <div className="skeleton rounded-[22px] aspect-[4/3] md:aspect-[4/5]" />
          <div className="space-y-3">
            <div className="skeleton h-10 w-3/4 rounded-lg" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-4 w-2/5 rounded" />
            <div className="skeleton h-[50px] w-full rounded-full !mt-7" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <SiteHeader />
        <main id="main-content" className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <h1 className="text-[21px] font-semibold tracking-[-0.015em]">
            {isNotFound(error) ? "This place isn\u2019t on Locals" : "Couldn\u2019t load this restaurant"}
          </h1>
          <p className="text-[15px] max-w-sm" style={{ color: "var(--text-secondary)" }}>
            {isNotFound(error) ? "The link may be out of date." : "Check your connection and try again."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 mt-4 w-full max-w-xs sm:max-w-none sm:w-auto">
            {isNotFound(error) ? (
              <Link href="/recommendations" className="cta-btn inline-flex items-center justify-center px-7 text-[15px]">Browse all places</Link>
            ) : (
              <button onClick={retry} className="cta-btn inline-flex items-center justify-center px-7 text-[15px]">Try again</button>
            )}
            <Link href="/" className="soft-btn inline-flex items-center justify-center px-7 text-[15px]">Go home</Link>
          </div>
        </main>
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
  const whatLine = [r.cuisine !== "Restaurant" ? r.cuisine : null, price].filter(Boolean).join(" · ");
  const verdictText = getVerdict(r.local_weighted_rating ?? 0, r.tourist_weighted_rating ?? 0);
  const themes = parseReviewThemes(r.review_themes as string | undefined);
  const hours = parseHours(r.opening_hours as string | undefined);
  const today = nycToday();
  const todayHours = hours.find((e) => e.day === today)?.hours;
  // The green tag already says "Open now", so the hours line only says closed.
  const openLine = r.is_open_now === false ? "Closed now" : null;
  const contactTile = r.phone
    ? { href: `tel:${r.phone}`, icon: "phone" as const, label: "Call", external: false }
    : r.website
      ? { href: r.website, icon: "globe" as const, label: "Website", external: true }
      : null;

  function toggleSave() {
    if (!user) {
      setSignInReason("Sign in to save restaurants");
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    const wasSaved = saved;
    const nowSaved = !wasSaved;
    setSaved(nowSaved);
    setSaveError(false);
    if (nowSaved) { setSavePop(true); setTimeout(() => setSavePop(false), 400); }
    fetch("/api/saved", {
      method: nowSaved ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant_id: r.restaurant_id }),
    }).then((res) => {
      if (res.status === 401) { setSaved(wasSaved); setSignInReason("Your session ended. Sign in again to save."); return; }
      if (!res.ok) { setSaved(wasSaved); setSaveError(true); }
    }).catch(() => { setSaved(wasSaved); setSaveError(true); })
      .finally(() => { savingRef.current = false; });
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: r.name, text: `${r.name} on Locals`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed, or clipboard blocked: nothing to undo.
    }
  }

  return (
    <div className="min-h-screen flex flex-col scene" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      <main id="main-content" className="relative flex-1">
        {/* The page takes on the restaurant's own colors: its photo,
            blurred behind a scrim that follows the theme (see .scene). */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="scene-backdrop">
            <Image src={heroUrl} alt="" fill sizes="40vw" className="object-cover" />
          </div>
          <div className="scene-scrim" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-3 md:pt-6 pb-14">
          <button onClick={back} className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-[15px] font-medium transition-opacity hover:opacity-70">
            <Icon name="arrow-left" size={17} /> Back
          </button>

          <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6 md:gap-12 items-start mt-2">
            {/* Cover: the one sharp photo on the page. */}
            <div className="cover-in relative rounded-[22px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.3)] md:sticky md:top-[88px] aspect-[4/3] md:aspect-[4/5] md:max-h-[calc(100svh-112px)]" style={{ backgroundColor: "var(--bg-inset)" }}>
              <div className="absolute inset-0">
                <Image
                  src={heroUrl}
                  alt={`${r.name} in ${r.neighborhood}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="object-cover"
                  priority
                  onError={() => setHeroTier((t) => Math.min(t + 1, heroCandidates.length - 1))}
                />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="font-display text-[34px] md:text-[44px] text-balance [overflow-wrap:anywhere] rise" style={rise(0)}>{r.name}</h1>
              <div className="flex flex-col gap-1 mt-3 text-[15px] rise" style={{ color: "var(--text-secondary)", ...rise(1) }}>
                <Fact icon="map-pin">{r.neighborhood}</Fact>
                {whatLine && <Fact icon="utensils">{whatLine}</Fact>}
                <Fact icon="star">
                  Locals rate it {(r.local_weighted_rating ?? r.total_score).toFixed(1)}
                  {r.archetype ? ` · ${sentenceCase(r.archetype)}` : ""}
                </Fact>
                {(openLine || todayHours) && (
                  <Fact icon="clock">{[openLine, todayHours ? `Today ${todayHours}` : null].filter(Boolean).join(" · ")}</Fact>
                )}
              </div>
              {r.is_open_now === true && (
                <div className="flex flex-wrap gap-1.5 mt-3.5 rise" style={rise(2)}>
                  <span className="tag tag-open">Open now</span>
                </div>
              )}

              <a href={r.url} target="_blank" rel="noopener noreferrer" className="cta-btn flex items-center justify-center gap-2 w-full mt-6 text-[16px] rise" style={rise(3)}>
                <Icon name="navigation" size={16} /> Get directions
              </a>
              <div className={`grid ${contactTile ? "grid-cols-3" : "grid-cols-2"} gap-2 mt-2.5 rise`} style={rise(4)}>
                {bucket ? (
                  <Link href="/visited" className="tile-btn"><Icon name="circle-check" size={19} />Visited</Link>
                ) : (
                  <button onClick={toggleSave} className="tile-btn" aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save restaurant"}>
                    <span className={savePop ? "heart-pop" : undefined}>
                      <Icon name="bookmark" size={19} className={saved ? "fill-current" : undefined} />
                    </span>
                    {saveError ? "Try again" : saved ? "Saved" : "Save"}
                  </button>
                )}
                <button onClick={share} className="tile-btn"><Icon name="share" size={19} />{copied ? "Copied" : "Share"}</button>
                {contactTile && (
                  <a href={contactTile.href} className="tile-btn" {...(contactTile.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <Icon name={contactTile.icon} size={19} />{contactTile.label}
                  </a>
                )}
              </div>

              <section className="mt-9 rise" style={rise(5)}>
                <h2 className="text-[17px] font-semibold mb-1.5">The local take</h2>
                <p className="text-[16px] leading-relaxed max-w-[60ch]" style={{ color: "var(--text-secondary)" }}>{verdictText}</p>
              </section>

              {themes && themes.standout_dishes.length > 0 && (
                <section className="mt-8 rise" style={rise(6)}>
                  <h2 className="text-[17px] font-semibold mb-2">What to order</h2>
                  <ol className="flex flex-col">
                    {themes.standout_dishes.map((d, i) => (
                      <li key={d} className="flex items-baseline gap-3 py-2.5 text-[16px]" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
                        <span className="tabular-nums text-[14px] w-4 shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                        {d}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {themes && themes.vibe_and_service.length > 0 && (
                <section className="mt-8 rise" style={rise(7)}>
                  <h2 className="text-[17px] font-semibold mb-1.5">The vibe</h2>
                  <div className="flex flex-col gap-2 max-w-[60ch]">
                    {themes.vibe_and_service.map((v) => (
                      <p key={v} className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{v}</p>
                    ))}
                  </div>
                </section>
              )}

              {themes?.wait_time_note && (
                <section className="mt-8">
                  <h2 className="text-[17px] font-semibold mb-1.5">Heads up</h2>
                  <p className="text-[15px] leading-relaxed max-w-[60ch]" style={{ color: "var(--text-secondary)" }}>{themes.wait_time_note}</p>
                </section>
              )}

              {(r.address || hours.length > 0 || r.website) && (
                <section className="mt-8">
                  <h2 className="text-[17px] font-semibold mb-2">Hours and info</h2>
                  {hours.length > 0 && (
                    <dl className="flex flex-col text-[15px] tabular-nums">
                      {DAYS_ORDER.map((day) => {
                        const entry = hours.find((e) => e.day === day);
                        if (!entry) return null;
                        const isToday = day === today;
                        return (
                          <div key={day} className="flex justify-between gap-4 py-1.5" style={{ color: isToday ? "var(--text)" : "var(--text-secondary)", fontWeight: isToday ? 600 : 400 }}>
                            <dt>{day}</dt>
                            <dd className="text-right">{entry.hours}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                  <div className="flex flex-col gap-2 mt-4 text-[15px]" style={{ color: "var(--text-secondary)" }}>
                    {r.address && <Fact icon="map-pin">{r.address}</Fact>}
                    {r.phone && <Fact icon="phone"><a href={`tel:${r.phone}`} className="underline-offset-4 hover:underline">{r.phone}</a></Fact>}
                    {r.website && (
                      <Fact icon="globe">
                        <a href={r.website} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline break-all">
                          {r.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </a>
                      </Fact>
                    )}
                  </div>
                </section>
              )}

              {similar.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-[17px] font-semibold mb-4">More in {r.neighborhood}</h2>
                  <ScrollSpotlight watch={similar.map((s) => s.restaurant_id).join(",")}>
                    <ul className="flex flex-col gap-5">
                      {similar.map((s) => (
                        <li key={s.restaurant_id}>
                          <Link href={`/restaurant/${s.restaurant_id}`} className="row-link block rounded-2xl p-2.5 -m-2.5">
                            <PlaceRow c={toCandidate(s)} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </ScrollSpotlight>
                </section>
              )}
            </div>
          </div>
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
