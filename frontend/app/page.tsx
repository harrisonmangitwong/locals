"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NEIGHBORHOODS = [
  { label: "East Village", borough: "Manhattan" },
  { label: "West Village", borough: "Manhattan" },
  { label: "Lower East Side", borough: "Manhattan" },
  { label: "SoHo", borough: "Manhattan" },
  { label: "Harlem", borough: "Manhattan" },
  { label: "Upper East Side", borough: "Manhattan" },
  { label: "Midtown", borough: "Manhattan" },
  { label: "Williamsburg", borough: "Brooklyn" },
  { label: "Greenpoint", borough: "Brooklyn" },
  { label: "Park Slope", borough: "Brooklyn" },
  { label: "Bushwick", borough: "Brooklyn" },
  { label: "Flushing", borough: "Queens" },
  { label: "Astoria", borough: "Queens" },
  { label: "Jackson Heights", borough: "Queens" },
  { label: "Belmont", borough: "Bronx" },
];

const CUISINES = [
  "Korean", "Italian", "Thai", "Chinese", "Japanese",
  "Mexican", "Indian", "American", "Seafood", "Mediterranean",
  "Halal", "Ramen", "Pizza", "French", "Deli",
];

export default function Home() {
  const router = useRouter();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");

  function handleFind() {
    const params = new URLSearchParams();
    if (selectedNeighborhood) params.set("neighborhood", selectedNeighborhood);
    if (selectedCuisine) params.set("cuisine", selectedCuisine);
    router.push(`/recommendations${params.size ? `?${params}` : ""}`);
  }

  function ctaLabel() {
    if (selectedNeighborhood && selectedCuisine) return `Find ${selectedCuisine} in ${selectedNeighborhood}`;
    if (selectedNeighborhood) return `Find restaurants in ${selectedNeighborhood}`;
    if (selectedCuisine) return `Find ${selectedCuisine} restaurants`;
    return "Find a restaurant";
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="font-display text-xl" style={{ color: "var(--text)" }}>
          Locals
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link href="/recommendations" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Recs</Link>
          <Link href="/favorites" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Saved</Link>
          <Link href="/visited" className="text-xs sm:text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>Visited</Link>
          <Link href="/about" className="hidden sm:inline text-sm transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>About</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-16 sm:py-24 text-center">
        {/* Eyebrow */}
        <span
          className="inline-block text-xs font-medium tracking-widest uppercase mb-8 px-3 py-1.5 rounded-full"
          style={{ color: "var(--accent-text)", backgroundColor: "var(--accent-soft)", letterSpacing: "0.12em" }}
        >
          New York City
        </span>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl mb-6 max-w-2xl" style={{ color: "var(--text)" }}>
          Eat like a local.
          <br />
          <span style={{ color: "var(--accent)" }}>Not a tourist.</span>
        </h1>

        <p className="text-lg md:text-xl max-w-lg mb-12 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          We analyze thousands of NYC restaurant reviews to find the places
          real New Yorkers love — not the ones tourists stumble into.
        </p>

        {/* Discovery pickers */}
        <div className="w-full max-w-2xl mb-8 text-left space-y-5">
          {/* Neighborhood */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
              Neighborhood
            </p>
            <div className="flex flex-wrap gap-2">
              {NEIGHBORHOODS.map((n) => {
                const active = selectedNeighborhood === n.label;
                return (
                  <button
                    key={n.label}
                    onClick={() => setSelectedNeighborhood(active ? "" : n.label)}
                    className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-100"
                    style={{
                      backgroundColor: active ? "var(--accent)" : "var(--bg-subtle)",
                      color: active ? "#ffffff" : "var(--text-secondary)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cuisine */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
              Cuisine
            </p>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => {
                const active = selectedCuisine === c;
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCuisine(active ? "" : c)}
                    className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-100"
                    style={{
                      backgroundColor: active ? "var(--accent)" : "var(--bg-subtle)",
                      color: active ? "#ffffff" : "var(--text-secondary)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleFind}
          className="cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold mb-14 transition-all duration-150"
          style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
        >
          {ctaLabel()} &rarr;
        </button>

        {/* Stats row */}
        <div
          className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 px-8 py-6 rounded-2xl"
          style={{ color: "var(--text-muted)", backgroundColor: "var(--warm-soft)" }}
        >
          <div className="text-center">
            <div className="font-display text-3xl sm:text-4xl mb-1" style={{ color: "var(--text)" }}>407</div>
            <div className="text-xs uppercase tracking-wider">Restaurants</div>
          </div>
          <div className="hidden sm:block w-px h-10" style={{ backgroundColor: "var(--border-strong)" }} />
          <div className="text-center">
            <div className="font-display text-3xl sm:text-4xl mb-1" style={{ color: "var(--text)" }}>48k+</div>
            <div className="text-xs uppercase tracking-wider">Reviews analyzed</div>
          </div>
          <div className="hidden sm:block w-px h-10" style={{ backgroundColor: "var(--border-strong)" }} />
          <div className="text-center">
            <div className="font-display text-3xl sm:text-4xl mb-1" style={{ color: "var(--text)" }}>5</div>
            <div className="text-xs uppercase tracking-wider">Boroughs</div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-28 max-w-2xl w-full text-left">
          <h2 className="font-display text-2xl mb-8" style={{ color: "var(--text)" }}>How it works</h2>
          <div className="space-y-8">
            <div className="flex gap-5">
              <span className="font-display text-3xl leading-none shrink-0 w-8" style={{ color: "var(--warm)" }}>1</span>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>Score every reviewer</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  We look at each reviewer&apos;s history to figure out if they live in NYC or were just passing through.
                </p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex gap-5">
              <span className="font-display text-3xl leading-none shrink-0 w-8" style={{ color: "var(--warm)" }}>2</span>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>Weight the ratings</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Local reviewers&apos; opinions count more. Restaurants that coast on out-of-towner hype get penalized.
                </p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)" }} />
            <div className="flex gap-5">
              <span className="font-display text-3xl leading-none shrink-0 w-8" style={{ color: "var(--warm)" }}>3</span>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>Rank by local love</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Restaurants where locals keep coming back — not ones that ride tourist hype — rise to the top.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
