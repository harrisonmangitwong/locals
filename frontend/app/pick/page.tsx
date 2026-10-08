"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import { getPhotoUrl } from "@/lib/photoFallback";
import { getVerdict } from "@/lib/verdict";
import { NEIGHBORHOOD_COORDS } from "@/lib/neighborhoods";
import { useCurrentUser } from "@/lib/useCurrentUser";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Fine steps at walking distance, whole miles after that.
const DIST_STEPS = [0.2, 0.4, 0.6, 0.8, 1, 2, 3, 4, 5];
const DEFAULT_DIST_IDX = 5; // 2 mi
const PRICES = ["$", "$$", "$$$", "$$$$"];
// Shown before "More" so price and distance stay on the first screen on a phone.
const COMMON_CUISINES = ["American", "Italian", "Chinese", "Japanese", "Korean", "Mexican", "Thai", "Pizza", "Indian"];

interface Candidate {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  price_midpoint: number | null;
  image_url: string | null;
  lat: number;
  lng: number;
  local_weighted_rating: number;
  tourist_weighted_rating: number;
  distance_mi: number | null;
  // From the review analysis: up to 3 standout dishes, the top line on
  // vibe/service (shown when there's no standout dish), and wait times.
  dishes: string[];
  vibe: string | null;
  wait_note: string | null;
}

type Screen = "prefs" | "compare" | "result";
type Location = { lat: number; lng: number; label: string } | null;

function fmtMiles(m: number) {
  return `${m < 1 ? m.toFixed(1) : String(m)} mi`;
}
function priceLabel(mid: number | null) {
  if (!mid) return null;
  return mid <= 15 ? "$" : mid <= 30 ? "$$" : mid <= 60 ? "$$$" : "$$$$";
}
function metaLine(c: Candidate) {
  const parts = [c.neighborhood, c.cuisine !== "Restaurant" ? c.cuisine : null, priceLabel(c.price_midpoint)];
  if (c.distance_mi != null) parts.push(`${c.distance_mi < 1 ? c.distance_mi.toFixed(1) : c.distance_mi.toFixed(1).replace(/\.0$/, "")} mi away`);
  return parts.filter(Boolean).join(" · ");
}

function PickPhoto({ c, sizes, className }: { c: Candidate; sizes: string; className: string }) {
  const [src, setSrc] = useState(c.image_url || getPhotoUrl(c.cuisine));
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: "var(--bg-inset)" }}>
      <Image src={src} alt={`${c.name} in ${c.neighborhood}`} fill sizes={sizes} className="object-cover" onError={() => setSrc(getPhotoUrl(c.cuisine))} />
    </div>
  );
}

function ChoiceCard({ c, onChoose, still, state }: { c: Candidate; onChoose: () => void; still?: boolean; state?: "chosen" | "passed" }) {
  return (
    <button
      onClick={onChoose}
      aria-label={`Choose ${c.name}`}
      className={`pick-choice w-full text-left rounded-2xl overflow-hidden flex flex-col${state ? ` is-${state}` : ""}`}
    >
      <div className="relative">
        <PickPhoto c={c} sizes="(max-width: 768px) 100vw, 480px" className="h-28 md:h-56" />
        {still && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--accent)", color: "#241f18" }}>
            Still in
          </span>
        )}
      </div>
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <span className="font-semibold text-base md:text-lg leading-snug" style={{ color: "var(--text)" }}>{c.name}</span>
        <span className="text-xs md:text-sm" style={{ color: "var(--text-secondary)" }}>{metaLine(c)}</span>
        <span className="text-sm" style={{ color: "var(--text)" }}>
          Locals <b style={{ color: "var(--success-strong)" }}>{c.local_weighted_rating.toFixed(1)}</b>
          <span style={{ color: "var(--text-muted)" }}> · Tourists {c.tourist_weighted_rating.toFixed(1)}</span>
        </span>
        {(c.dishes.length > 0 || c.vibe) && (
          <div className="mt-2 pt-2.5" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="block text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>
              {c.dishes.length ? "Known for" : "The vibe"}
            </span>
            <span className="text-sm leading-snug line-clamp-1 md:line-clamp-2" style={{ color: "var(--text-secondary)" }}>
              {c.dishes.length ? c.dishes.join(" · ") : c.vibe}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export default function PickPage() {
  const { user } = useCurrentUser();

  const [screen, setScreen] = useState<Screen>("prefs");
  const [location, setLocation] = useState<Location>(null);
  const [locStatus, setLocStatus] = useState<"asking" | "granted" | "denied">("asking");
  const [manualHood, setManualHood] = useState("");
  const [deviceLocation, setDeviceLocation] = useState<Location>(null);
  const [pickingHood, setPickingHood] = useState(false);

  const [cuisineOptions, setCuisineOptions] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<Set<string>>(new Set());
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [prices, setPrices] = useState<Set<string>>(new Set());
  const [distIdx, setDistIdx] = useState(DEFAULT_DIST_IDX);
  const [onlyNew, setOnlyNew] = useState(false);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);

  const [shortlist, setShortlist] = useState<Candidate[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [champ, setChamp] = useState<Candidate | null>(null);
  const [queue, setQueue] = useState<Candidate[]>([]);
  const [round, setRound] = useState(1);
  const [rounds, setRounds] = useState(1);
  const [result, setResult] = useState<Candidate | null>(null);
  const [runnerUp, setRunnerUp] = useState<Candidate | null>(null);
  // Which side was just tapped (true = left/champ); held briefly so the
  // choice registers visually before the next pair slides in.
  const [picked, setPicked] = useState<boolean | null>(null);

  // Location: asked once on arrival; neighborhood picker if declined or if
  // they're planning for somewhere other than where they're standing.
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Rounded to ~100m before it leaves the device; it's only used
        // for this search and never stored.
        const here = {
          lat: Math.round(pos.coords.latitude * 1000) / 1000,
          lng: Math.round(pos.coords.longitude * 1000) / 1000,
          label: "Near you",
        };
        setDeviceLocation(here);
        setLocation(here);
        setLocStatus("granted");
      },
      () => setLocStatus("denied"),
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/filters`)
      .then((r) => r.json())
      .then((d) => setCuisineOptions((d.cuisines ?? []).filter((c: string) => c !== "Restaurant")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/ratings")
      .then((r) => r.json())
      .then((d) => setVisitedIds((d.ratings ?? []).map((r: { restaurant_id: string }) => r.restaurant_id)))
      .catch(() => {});
  }, [user]);

  // Live shortlist: re-fetched (debounced) whenever an answer changes, so
  // the button always says how many places fit before anyone taps it.
  useEffect(() => {
    if (locStatus === "asking") return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (location) {
        params.set("lat", String(location.lat));
        params.set("lng", String(location.lng));
        params.set("max_miles", String(DIST_STEPS[distIdx]));
      }
      if (cuisines.size) params.set("cuisines", [...cuisines].join(","));
      if (prices.size) params.set("prices", [...prices].join(","));
      if (onlyNew && visitedIds.length) params.set("exclude_ids", visitedIds.join(","));
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/pick?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const d = await res.json();
        setShortlist(d.candidates ?? []);
        setNotice(d.notice ?? null);
        setFetchError(false);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setFetchError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [location, locStatus, distIdx, cuisines, prices, onlyNew, visitedIds]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  function finish(winner: Candidate, second: Candidate | null) {
    setResult(winner);
    setRunnerUp(second);
    setScreen("result");
  }

  function start() {
    if (shortlist.length === 1) return finish(shortlist[0], null);
    setChamp(shortlist[0]);
    setQueue(shortlist.slice(1));
    setRound(1);
    setRounds(shortlist.length - 1);
    setScreen("compare");
  }

  function choose(keepChamp: boolean) {
    if (!champ || !queue.length || picked !== null) return;
    setPicked(keepChamp);
    setTimeout(() => {
      setPicked(null);
      advance(keepChamp);
    }, 260);
  }

  function advance(keepChamp: boolean) {
    if (!champ || !queue.length) return;
    const [challenger, ...rest] = queue;
    const winner = keepChamp ? champ : challenger;
    const loser = keepChamp ? challenger : champ;
    if (!rest.length) return finish(winner, loser);
    setChamp(winner);
    setQueue(rest);
    setRound((r) => r + 1);
  }

  // Arrow keys pick left/right on a keyboard.
  useEffect(() => {
    if (screen !== "compare") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") { e.preventDefault(); choose(true); }
      if (e.key === "ArrowRight") { e.preventDefault(); choose(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function toggle(set: Set<string>, value: string, update: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    update(next);
  }

  const count = shortlist.length;
  const visibleCuisines = showAllCuisines
    ? cuisineOptions
    : cuisineOptions.filter((c) => COMMON_CUISINES.includes(c) || cuisines.has(c));
  const hiddenCuisineCount = cuisineOptions.length - visibleCuisines.length;
  const ctaHint = loading
    ? "Finding places that fit..."
    : fetchError
      ? "Couldn't load places. Check your connection and try again."
      : count >= 2
        ? `We'll compare ${count} places that are open now`
        : count === 1
          ? "Only one place fits. Tap to see it."
          : "Nothing open fits yet. Try fewer filters.";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader />

      {screen === "prefs" && (
        <>
          <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8 grid md:grid-cols-[1.15fr_1fr] gap-8 md:gap-12 items-start">
            <div className="min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl mb-2">What sounds good?</h1>
              <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                {locStatus === "asking" && <span>Finding your location...</span>}
                {location && (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span>{location.label}</span>
                  </>
                )}
                {locStatus === "granted" && !pickingHood && (
                  <button
                    onClick={() => setPickingHood(true)}
                    className="font-semibold underline underline-offset-4 min-h-[44px] -my-3 px-1 transition-opacity hover:opacity-75"
                    style={{ color: "var(--text)" }}
                  >
                    Change
                  </button>
                )}
                {locStatus !== "asking" && (
                  <>
                    {location && <span aria-hidden="true">·</span>}
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success-strong)" }} aria-hidden="true" />
                    <span>Open now</span>
                  </>
                )}
              </div>

              {(locStatus === "denied" || pickingHood) && (
                <div className="mt-3">
                  <label htmlFor="pick-hood" className="block text-sm font-semibold mb-1.5">Where are you?</label>
                  <select
                    id="pick-hood"
                    value={manualHood}
                    onChange={(e) => {
                      const name = e.target.value;
                      setManualHood(name);
                      if (name === "" && deviceLocation) {
                        setLocation(deviceLocation);
                        setPickingHood(false);
                        return;
                      }
                      const c = NEIGHBORHOOD_COORDS[name];
                      setLocation(c ? { lat: c[0], lng: c[1], label: `Near ${name}` } : null);
                    }}
                    className="filter-control w-full rounded-lg px-3 py-3 text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)", colorScheme: "light dark" }}
                  >
                    <option value="">{deviceLocation ? "My current location" : "Anywhere in NYC"}</option>
                    {Object.keys(NEIGHBORHOOD_COORDS).sort().map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}

              <section className="mt-6">
                <div className="flex justify-between items-baseline mb-2">
                  <h2 className="text-sm font-bold">Craving</h2>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{cuisines.size ? `${cuisines.size} picked` : "Anything"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCuisines(new Set())}
                    aria-pressed={cuisines.size === 0}
                    className={`filter-pill text-sm font-semibold px-3.5 py-2 rounded-full min-h-[44px]${cuisines.size === 0 ? " is-active" : ""}`}
                  >
                    Anything
                  </button>
                  {visibleCuisines.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggle(cuisines, c, setCuisines)}
                      aria-pressed={cuisines.has(c)}
                      className={`filter-pill text-sm font-semibold px-3.5 py-2 rounded-full min-h-[44px]${cuisines.has(c) ? " is-active" : ""}`}
                    >
                      {c}
                    </button>
                  ))}
                  {(hiddenCuisineCount > 0 || showAllCuisines) && (
                    <button
                      onClick={() => setShowAllCuisines((v) => !v)}
                      aria-expanded={showAllCuisines}
                      className="text-sm font-semibold px-2 min-h-[44px] underline underline-offset-4 transition-opacity hover:opacity-75"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {showAllCuisines ? "Fewer" : `${hiddenCuisineCount} more`}
                    </button>
                  )}
                </div>
              </section>

              <section className="mt-6">
                <div className="flex justify-between items-baseline mb-2">
                  <h2 className="text-sm font-bold">Price</h2>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{prices.size ? [...prices].join(", ") : "Any price"}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {PRICES.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggle(prices, p, setPrices)}
                      aria-pressed={prices.has(p)}
                      className={`filter-pill text-sm font-semibold py-2 rounded-full min-h-[44px] tabular-nums${prices.has(p) ? " is-active" : ""}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>

              {location && (
                <section className="mt-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <label htmlFor="pick-distance" className="text-sm font-bold">How far</label>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Within {fmtMiles(DIST_STEPS[distIdx])}</span>
                  </div>
                  <input
                    id="pick-distance"
                    type="range"
                    min={0}
                    max={DIST_STEPS.length - 1}
                    step={1}
                    value={distIdx}
                    onChange={(e) => setDistIdx(Number(e.target.value))}
                    aria-valuetext={`Within ${fmtMiles(DIST_STEPS[distIdx])}`}
                    className="w-full h-7"
                    style={{ accentColor: "var(--cta-bg)" }}
                  />
                </section>
              )}

              {visitedIds.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-sm font-bold mb-2">Places you&apos;ve been</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: "Include them", value: false }, { label: "Only new to me", value: true }].map((o) => (
                      <button
                        key={o.label}
                        onClick={() => setOnlyNew(o.value)}
                        aria-pressed={onlyNew === o.value}
                        className={`filter-pill text-sm font-semibold py-2 rounded-full min-h-[44px]${onlyNew === o.value ? " is-active" : ""}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }} aria-label="Places that fit">
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                Your shortlist{count ? ` · ${count}` : ""}
              </p>
              {notice && <p className="text-sm rounded-lg px-3 py-2 mb-2" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{notice}</p>}
              {!loading && count === 0 && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nothing open fits yet. Try fewer filters.</p>}
              <ul className="flex flex-col" style={{ opacity: loading ? 0.5 : 1 }}>
                {shortlist.map((c) => (
                  <li key={c.restaurant_id} className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 items-center py-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <PickPhoto c={c} sizes="52px" className="w-[52px] h-[52px] rounded-lg" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{metaLine(c)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </main>

          <div className="sticky bottom-0 w-full" style={{ backgroundColor: "var(--bg)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col-reverse md:flex-row md:items-center gap-2 md:gap-4">
              <p className="text-xs text-center md:text-left md:mr-auto" style={{ color: "var(--text-muted)" }} aria-live="polite">
                {ctaHint}
              </p>
              <button
                onClick={start}
                disabled={loading || count === 0}
                className="cta-btn w-full md:w-auto md:min-w-[220px] px-6 py-3 rounded-full text-base font-semibold disabled:opacity-50"
              >
                Help me pick
              </button>
            </div>
          </div>
        </>
      )}

      {screen === "compare" && champ && queue[0] && (
        <>
          <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-8">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setScreen("prefs")} className="text-sm font-semibold min-h-[44px] transition-opacity hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
                ← Change answers
              </button>
              <span className="text-xs font-bold uppercase tracking-wide tabular-nums" style={{ color: "var(--text-muted)" }}>
                Round {round} of {rounds}
              </span>
            </div>
            <div className="flex gap-1 mb-4" aria-hidden="true">
              {Array.from({ length: rounds }, (_, i) => (
                <span key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: i < round ? "var(--accent)" : "var(--bg-inset)" }} />
              ))}
            </div>
            {notice && round === 1 && (
              <p className="text-sm rounded-lg px-3 py-2 mb-3" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{notice}</p>
            )}
            <h1 className="font-display text-2xl sm:text-3xl mb-3 md:mb-4">Which sounds better tonight?</h1>
            <div className="grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 md:gap-5 items-stretch">
              <ChoiceCard key={champ.restaurant_id} c={champ} onChoose={() => choose(true)} still={round > 1} state={picked === null ? undefined : picked ? "chosen" : "passed"} />
              <span className="font-display text-sm text-center self-center" style={{ color: "var(--text-muted)" }} aria-hidden="true">OR</span>
              <ChoiceCard key={queue[0].restaurant_id} c={queue[0]} onChoose={() => choose(false)} state={picked === null ? undefined : picked ? "passed" : "chosen"} />
            </div>
          </main>
          <div className="sticky bottom-0 w-full" style={{ backgroundColor: "var(--bg)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
              <p className="hidden md:block text-xs mr-auto" style={{ color: "var(--text-muted)" }}>Use ← and → to choose</p>
              <button
                onClick={() => finish(champ, queue[0])}
                className="w-full md:w-auto md:min-w-[220px] px-6 py-3 rounded-full text-sm font-semibold min-h-[44px] transition-opacity hover:opacity-80"
                style={{ border: "1px solid var(--border-strong)", color: "var(--text)", backgroundColor: "var(--bg-subtle)" }}
              >
                Just pick for me
              </button>
            </div>
          </div>
        </>
      )}

      {screen === "result" && result && (
        <>
          <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-8">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setScreen("prefs")} className="text-sm font-semibold min-h-[44px] transition-opacity hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
                ← Pick again
              </button>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Your pick</span>
            </div>
            <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 md:gap-8 items-start">
              <PickPhoto key={result.restaurant_id} c={result} sizes="(max-width: 768px) 100vw, 560px" className="h-60 md:h-[420px] rounded-2xl" />
              <div className="min-w-0">
                <h1 className="font-display text-3xl md:text-4xl leading-tight">{result.name}</h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{metaLine(result)}</p>
                <div className="rounded-2xl px-4 py-3 mt-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Why this one</p>
                  <p className="text-sm leading-relaxed">{getVerdict(result.local_weighted_rating, result.tourist_weighted_rating)}</p>
                  {result.dishes.length > 0 && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-1" style={{ color: "var(--text-muted)" }}>What to order</p>
                      <ul className="text-sm leading-relaxed list-disc pl-5" style={{ color: "var(--text-secondary)" }}>
                        {result.dishes.map((d) => <li key={d}>{d}</li>)}
                      </ul>
                    </>
                  )}
                  {result.vibe && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-1" style={{ color: "var(--text-muted)" }}>The vibe</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.vibe}</p>
                    </>
                  )}
                  {result.wait_note && (
                    <p className="text-sm leading-relaxed mt-4" style={{ color: "var(--text-secondary)" }}>
                      <b style={{ color: "var(--text)" }}>Heads up:</b> {result.wait_note}
                    </p>
                  )}
                </div>
                {runnerUp && (
                  <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
                    Close second:{" "}
                    <button
                      onClick={() => { setResult(runnerUp); setRunnerUp(result); }}
                      className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-75"
                      style={{ color: "var(--text)" }}
                    >
                      {runnerUp.name}
                    </button>
                  </p>
                )}
                <div className="hidden md:flex items-center gap-4 mt-6">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lng}`} target="_blank" rel="noopener noreferrer" className="cta-btn inline-flex items-center justify-center px-8 py-3 rounded-full text-base font-semibold">
                    Let&apos;s go
                  </a>
                  <Link href={`/restaurant/${result.restaurant_id}`} className="text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
                    See details
                  </Link>
                </div>
              </div>
            </div>
          </main>
          <div className="md:hidden sticky bottom-0 w-full" style={{ backgroundColor: "var(--bg)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="px-4 py-3 flex flex-col gap-2">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lng}`} target="_blank" rel="noopener noreferrer" className="cta-btn flex items-center justify-center px-6 py-3 rounded-full text-base font-semibold">
                Let&apos;s go
              </a>
              <Link href={`/restaurant/${result.restaurant_id}`} className="text-sm font-semibold text-center py-2" style={{ color: "var(--text-secondary)" }}>
                See details
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
