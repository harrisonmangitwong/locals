"use client";

import { type CSSProperties, useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Icon from "@/components/Icon";
import ScrollSpotlight from "@/components/ScrollSpotlight";
import { type Candidate, ChoiceBody, PickPhoto, PlaceRow, fmtDistance, priceLabel } from "@/components/PickCard";
import { NEIGHBORHOOD_COORDS } from "@/lib/neighborhoods";
import { useCurrentUser } from "@/lib/useCurrentUser";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Screen and round changes run inside a view transition, so the same
// restaurant photo travels between states: a shortlist thumbnail grows into
// a this-or-that photo, and the winner flies into the result cover.
// Without browser support (or with reduced motion) the change is instant.
function go(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

// Fine steps at walking distance, whole miles after that.
const DIST_STEPS = [0.2, 0.4, 0.6, 0.8, 1, 2, 3, 4, 5];
const DEFAULT_DIST_IDX = 5; // 2 mi
const PRICES = ["$", "$$", "$$$", "$$$$"];
// Shown before "More" so price and distance stay on the first screen on a phone.
const COMMON_CUISINES = ["American", "Italian", "Chinese", "Japanese", "Korean", "Mexican", "Thai", "Pizza", "Indian"];

type Screen = "prefs" | "compare" | "result";
type Location = { lat: number; lng: number; label: string } | null;

function fmtMiles(m: number) {
  return `${m < 1 ? m.toFixed(1) : String(m)} mi`;
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
  // On by default: the people this is for would rather try somewhere new.
  // Only takes effect once we know what they've been to.
  const [onlyNew, setOnlyNew] = useState(true);
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
  const [copied, setCopied] = useState(false);

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

  // Pre-fill craving and price from the taste profile set at onboarding, so
  // a returning user can go straight to comparing.
  useEffect(() => {
    if (!user || !cuisineOptions.length) return;
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const liked = ((d.preferredCuisines ?? []) as string[]).filter((c) => cuisineOptions.includes(c));
        if (liked.length) setCuisines((cur) => (cur.size ? cur : new Set(liked)));
        const budget = d.preferredPrice as number | null;
        if (budget != null) {
          const upTo = PRICES.indexOf(priceLabel(Math.max(budget, 1)) ?? "$$$$");
          setPrices((cur) => (cur.size ? cur : new Set(PRICES.slice(0, upTo + 1))));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, cuisineOptions]);

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

  // Layout effect so the new screen is already at the top when the view
  // transition takes its "after" snapshot.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  function finish(winner: Candidate, second: Candidate | null) {
    setResult(winner);
    setRunnerUp(second);
    setScreen("result");
  }

  function start() {
    go(() => {
      if (shortlist.length === 1) return finish(shortlist[0], null);
      setChamp(shortlist[0]);
      setQueue(shortlist.slice(1));
      setRound(1);
      setRounds(shortlist.length - 1);
      setScreen("compare");
    });
  }

  function choose(keepChamp: boolean) {
    if (!champ || !queue.length || picked !== null) return;
    setPicked(keepChamp);
    // A beat to see the choice register, then the winner glides into place.
    setTimeout(() => go(() => {
      setPicked(null);
      advance(keepChamp);
    }), 170);
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

  async function share(c: Candidate) {
    const url = `${window.location.origin}/restaurant/${c.restaurant_id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: c.name, text: `${c.name} tonight?`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed, or clipboard blocked: nothing to undo.
    }
  }

  const sideState = (left: boolean) => (picked === null ? "" : picked === left ? " is-chosen" : " is-passed");
  const directions = result ? `https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lng}` : "";

  return (
    <div className={`min-h-screen flex flex-col${screen === "result" ? " scene" : ""}`} style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <SiteHeader current="pick" tabBar={false} />

      {screen === "prefs" && (
        <>
          <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-7 md:pt-12 pb-10 grid md:grid-cols-[minmax(0,1fr)_380px] gap-10 md:gap-14 items-start">
            <div className="min-w-0">
              <h1 className="font-display text-[32px] sm:text-[40px]">What sounds good?</h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                {locStatus === "asking" && <span>Finding your location...</span>}
                {location && (
                  <span className="flex items-center gap-1.5"><Icon name="map-pin" size={14} />{location.label}</span>
                )}
                {locStatus === "granted" && !pickingHood && (
                  <button
                    onClick={() => setPickingHood(true)}
                    className="font-semibold min-h-[44px] -my-3 px-1 transition-opacity hover:opacity-70"
                    style={{ color: "var(--text)" }}
                  >
                    Change
                  </button>
                )}
                {locStatus !== "asking" && <span className="tag tag-open">Open now</span>}
              </div>

              {(locStatus === "denied" || pickingHood) && (
                <div className="mt-5">
                  <label htmlFor="pick-hood" className="block text-[15px] font-semibold mb-2">Where are you?</label>
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
                    className="filter-control w-full rounded-xl px-4 py-3 text-[15px] cursor-pointer"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "none", colorScheme: "light dark" }}
                  >
                    <option value="">{deviceLocation ? "My current location" : "Anywhere in NYC"}</option>
                    {Object.keys(NEIGHBORHOOD_COORDS).sort().map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}

              <section className="mt-9">
                <div className="flex justify-between items-baseline mb-3">
                  <h2 className="text-[17px] font-semibold">Craving</h2>
                  <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>{cuisines.size ? `${cuisines.size} picked` : "Anything"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCuisines(new Set())}
                    aria-pressed={cuisines.size === 0}
                    className={`filter-pill text-[15px] font-medium px-4 min-h-[44px]${cuisines.size === 0 ? " is-active" : ""}`}
                  >
                    Anything
                  </button>
                  {visibleCuisines.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggle(cuisines, c, setCuisines)}
                      aria-pressed={cuisines.has(c)}
                      className={`filter-pill text-[15px] font-medium px-4 min-h-[44px]${cuisines.has(c) ? " is-active" : ""}`}
                    >
                      {c}
                    </button>
                  ))}
                  {(hiddenCuisineCount > 0 || showAllCuisines) && (
                    <button
                      onClick={() => setShowAllCuisines((v) => !v)}
                      aria-expanded={showAllCuisines}
                      className="inline-flex items-center gap-0.5 text-[15px] font-semibold px-2 min-h-[44px] transition-opacity hover:opacity-70"
                    >
                      {showAllCuisines ? "Fewer" : `${hiddenCuisineCount} more`}
                      <Icon name="chevron-right" size={15} className={showAllCuisines ? "-rotate-90" : "rotate-90"} />
                    </button>
                  )}
                </div>
              </section>

              <section className="mt-8">
                <div className="flex justify-between items-baseline mb-3">
                  <h2 className="text-[17px] font-semibold">Price</h2>
                  <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>{prices.size ? [...prices].join(", ") : "Any price"}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {PRICES.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggle(prices, p, setPrices)}
                      aria-pressed={prices.has(p)}
                      className={`filter-pill text-[15px] font-medium min-h-[44px] tabular-nums${prices.has(p) ? " is-active" : ""}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>

              {location && (
                <section className="mt-8">
                  <div className="flex justify-between items-baseline mb-3">
                    <label htmlFor="pick-distance" className="text-[17px] font-semibold">How far</label>
                    <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>Within {fmtMiles(DIST_STEPS[distIdx])}</span>
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
                    className="price-slider"
                    style={{ "--slider-pct": `${(distIdx / (DIST_STEPS.length - 1)) * 100}%`, margin: "-9px 0" } as CSSProperties}
                  />
                </section>
              )}

              {visitedIds.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-[17px] font-semibold mb-3">Places you&apos;ve been</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: "Include them", value: false }, { label: "Only new to me", value: true }].map((o) => (
                      <button
                        key={o.label}
                        onClick={() => setOnlyNew(o.value)}
                        aria-pressed={onlyNew === o.value}
                        className={`filter-pill text-[15px] font-medium min-h-[44px]${onlyNew === o.value ? " is-active" : ""}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="md:sticky md:top-20" aria-label="Places that fit">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-[17px] font-semibold">Your shortlist</h2>
                <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>{count === 1 ? "1 place" : `${count} places`}</span>
              </div>
              {notice && <p className="text-[14px] leading-snug px-3.5 py-3 mb-4 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{notice}</p>}
              {!loading && count === 0 && <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>Nothing open fits yet. Try fewer filters.</p>}
              <ScrollSpotlight watch={shortlist.map((c) => c.restaurant_id).join(",")}>
              <ul className="flex flex-col gap-5 transition-opacity" style={{ opacity: loading ? 0.45 : 1 }}>
                {shortlist.map((c, i) => (
                  <li key={c.restaurant_id} className="rise" style={{ "--i": i } as CSSProperties}>
                    {/* New tab, so the answers and shortlist here survive a look at the details. */}
                    <a href={`/restaurant/${c.restaurant_id}`} target="_blank" rel="noopener" className="row-link block rounded-2xl p-2.5 -m-2.5" aria-label={`${c.name} details (opens in a new tab)`}>
                      <PlaceRow c={c} shared />
                    </a>
                  </li>
                ))}
              </ul>
              </ScrollSpotlight>
              <div className="hidden md:block mt-7">
                <button onClick={start} disabled={loading || count === 0} className="cta-btn w-full px-6 text-[16px]">
                  Help me pick
                </button>
                <p className="text-[13px] mt-2.5 text-center" style={{ color: "var(--text-secondary)" }} aria-live="polite">{ctaHint}</p>
              </div>
            </aside>
          </main>

          <div className="md:hidden sticky bottom-0 w-full" style={{ backgroundColor: "var(--bg)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="px-4 pt-2 pb-3 flex flex-col gap-1.5">
              <button onClick={start} disabled={loading || count === 0} className="cta-btn w-full px-6 text-[16px]">
                Help me pick
              </button>
              <p className="text-[12.5px] text-center" style={{ color: "var(--text-secondary)" }} aria-live="polite">{ctaHint}</p>
            </div>
          </div>
        </>
      )}

      {screen === "compare" && champ && queue[0] && (
        <>
          <main id="main-content" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-3 md:pt-8 pb-6">
            <div className="flex items-center justify-between">
              <button onClick={() => go(() => setScreen("prefs"))} className="inline-flex items-center gap-1.5 text-[15px] font-medium min-h-[44px] transition-opacity hover:opacity-70">
                <Icon name="arrow-left" size={17} /> Change answers
              </button>
              <span className="text-[14px] tabular-nums" style={{ color: "var(--text-secondary)" }}>Round {round} of {rounds}</span>
            </div>
            <div className="flex gap-1 mt-1" aria-hidden="true">
              {Array.from({ length: rounds }, (_, i) => (
                <span key={i} className="flex-1 h-1 rounded-full transition-colors" style={{ backgroundColor: i < round ? "var(--text)" : "var(--bg-inset)" }} />
              ))}
            </div>
            <h1 className="font-display text-[26px] sm:text-[34px] mt-4 md:mt-6">Which sounds better tonight?</h1>
            {notice && round === 1 && (
              <p className="text-[14px] mt-1.5" style={{ color: "var(--text-secondary)" }}>{notice}</p>
            )}
            <div className="grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 md:gap-6 mt-4 md:mt-6 items-start">
              <button key={champ.restaurant_id} onClick={() => choose(true)} aria-label={`Choose ${champ.name}`} className={`pick-choice${sideState(true)}`}>
                <ChoiceBody c={champ} still={round > 1} />
              </button>
              <span className="text-[13px] font-semibold text-center md:self-center md:pt-0" style={{ color: "var(--text-muted)" }} aria-hidden="true">or</span>
              <button key={queue[0].restaurant_id} onClick={() => choose(false)} aria-label={`Choose ${queue[0].name}`} className={`pick-choice fade-up${sideState(false)}`}>
                <ChoiceBody c={queue[0]} />
              </button>
            </div>
          </main>
          <div className="sticky bottom-0 w-full" style={{ backgroundColor: "var(--bg)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-3 flex items-center gap-4">
              <p className="hidden md:flex items-center gap-1.5 text-[13px] mr-auto" style={{ color: "var(--text-secondary)" }}>
                <kbd className="inline-flex items-center justify-center w-6 h-6 rounded-md" style={{ backgroundColor: "var(--bg-subtle)" }}><Icon name="arrow-left" size={12} /></kbd>
                <kbd className="inline-flex items-center justify-center w-6 h-6 rounded-md" style={{ backgroundColor: "var(--bg-subtle)" }}><Icon name="arrow-right" size={12} /></kbd>
                <span className="ml-1">to choose</span>
              </p>
              <button onClick={() => go(() => finish(champ, queue[0]))} className="soft-btn w-full md:w-auto md:min-w-[220px] px-6 text-[15px]">
                Just pick for me
              </button>
            </div>
          </div>
        </>
      )}

      {screen === "result" && result && (
        <main id="main-content" className="relative flex-1">
          {/* Clipped in its own layer so <main> can stay unclipped, which
              lets the cover stick while the details scroll. */}
          <div className="scene-layer" aria-hidden="true">
            <PickPhoto key={`bg-${result.restaurant_id}`} c={result} sizes="32px" className="scene-backdrop" />
            <div className="scene-scrim" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4 md:pt-10 pb-12 grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6 md:gap-12 items-start" key={result.restaurant_id}>
            <div className="relative rounded-[22px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.45)] md:sticky md:top-[88px]" style={{ viewTransitionName: `p-${result.restaurant_id}` }}>
              <PickPhoto c={result} sizes="(max-width: 768px) 100vw, 520px" priority className="relative block aspect-[4/3] md:aspect-[4/5] md:max-h-[calc(100svh-112px)]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[34px] md:text-[44px] text-balance [overflow-wrap:anywhere] rise" style={{ "--i": 0 } as CSSProperties}>{result.name}</h1>
              <div className="flex flex-col gap-1 mt-3 text-[15px] rise" style={{ color: "var(--text-secondary)", "--i": 1 } as CSSProperties}>
                <span className="flex items-center gap-2"><Icon name="map-pin" size={15} />{[result.neighborhood, result.distance_mi != null ? `${fmtDistance(result.distance_mi)} away` : null].filter(Boolean).join(" · ")}</span>
                <span className="flex items-center gap-2"><Icon name="utensils" size={15} />{[result.cuisine !== "Restaurant" ? result.cuisine : null, priceLabel(result.price_midpoint)].filter(Boolean).join(" · ")}</span>
                <span className="flex items-center gap-2"><Icon name="star" size={15} />Locals rate it {result.local_weighted_rating.toFixed(1)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3.5 rise" style={{ "--i": 2 } as CSSProperties}>
                <span className="tag tag-pick">Your pick</span>
                <span className="tag tag-open">Open now</span>
              </div>

              <a href={directions} target="_blank" rel="noopener noreferrer" className="cta-btn flex items-center justify-center gap-2 w-full mt-6 text-[16px] rise" style={{ "--i": 3 } as CSSProperties}>
                <Icon name="navigation" size={16} /> Let&rsquo;s go
              </a>
              <div className="grid grid-cols-3 gap-2 mt-2.5 rise" style={{ "--i": 4 } as CSSProperties}>
                <Link href={`/restaurant/${result.restaurant_id}`} className="tile-btn"><Icon name="info" size={19} />Details</Link>
                <button onClick={() => share(result)} className="tile-btn"><Icon name="share" size={19} />{copied ? "Copied" : "Share"}</button>
                <button onClick={() => go(() => setScreen("prefs"))} className="tile-btn"><Icon name="rotate-ccw" size={19} />Pick again</button>
              </div>

              {result.dishes.length > 0 && (
                <section className="mt-9 rise" style={{ "--i": 5 } as CSSProperties}>
                  <h2 className="text-[17px] font-semibold mb-2">What to order</h2>
                  <ol className="flex flex-col">
                    {result.dishes.map((d, i) => (
                      <li key={d} className="flex items-baseline gap-3 py-2.5 text-[16px]" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
                        <span className="tabular-nums text-[14px] w-4" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                        {d}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {result.vibe && (
                <section className="mt-7 rise" style={{ "--i": 6 } as CSSProperties}>
                  <h2 className="text-[17px] font-semibold mb-1.5">The vibe</h2>
                  <p className="text-[16px] leading-relaxed max-w-[60ch]" style={{ color: "var(--text-secondary)" }}>{result.vibe}</p>
                </section>
              )}
              {result.wait_note && (
                <section className="mt-7 rise" style={{ "--i": 7 } as CSSProperties}>
                  <h2 className="text-[17px] font-semibold mb-1.5">Heads up</h2>
                  <p className="text-[15px] leading-relaxed max-w-[60ch]" style={{ color: "var(--text-secondary)" }}>{result.wait_note}</p>
                </section>
              )}
              {runnerUp && (
                <section className="mt-9 rise" style={{ "--i": 8 } as CSSProperties}>
                  <h2 className="text-[17px] font-semibold mb-3">Close second</h2>
                  <button
                    onClick={() => go(() => { setResult(runnerUp); setRunnerUp(result); })}
                    className="w-full text-left rounded-2xl p-2.5 -m-2.5 transition-colors hover:bg-[var(--bg-card)]"
                    aria-label={`Switch to ${runnerUp.name}`}
                  >
                    <PlaceRow c={runnerUp} shared />
                  </button>
                </section>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
