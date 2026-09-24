"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantPicker from "@/components/RestaurantPicker";
import Chip from "@/components/Chip";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const PRICE_TIERS = ["$", "$$", "$$$", "$$$$"];

// The 10 neighborhoods with the most restaurants in the live dataset --
// one-tap picks for people who don't want to type, computed from
// backend/data.csv rather than guessed.
const POPULAR_NEIGHBORHOODS = [
  "West Village", "East Village", "Williamsburg", "Midtown", "Lower East Side",
  "Flushing", "Greenpoint", "Chelsea", "Murray Hill", "Upper East Side",
];

// The dataset's `cuisine` field also includes meal formats (Brunch, Cafe), dish
// focuses (Pizza, Ramen), and dietary tags (Vegan, Halal) alongside actual
// cuisines. Onboarding only asks about cuisine proper -- keeping the picker to
// this set (and dropping the meaningless "Restaurant" value) is what makes it
// a coherent, answerable question instead of a mixed-bag one.
const CUISINE_ORIGINS = new Set([
  "American", "Caribbean", "Chinese", "French", "Greek", "Indian", "Italian",
  "Japanese", "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Peruvian",
  "Thai", "Vietnamese",
]);
const INITIAL_VISIBLE_CHIPS = 8;

interface RestaurantResult {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  image_url?: string;
}

function ExpandableChipGroup({
  label,
  options,
  selected,
  onToggle,
  expanded,
  onToggleExpanded,
}: {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  if (options.length === 0) return null;
  const visible = options.slice(0, INITIAL_VISIBLE_CHIPS);
  const hidden = options.slice(INITIAL_VISIBLE_CHIPS);

  return (
    <div className="mb-5 last:mb-0">
      {label && <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>}
      <div className="flex flex-wrap gap-2">
        {visible.map((o) => (
          <Chip key={o} label={o} active={selected.includes(o)} onClick={() => onToggle(o)} />
        ))}
      </div>
      {hidden.length > 0 && (
        <>
          <div className={`filter-expand${expanded ? " open" : ""}`}>
            <div className="filter-expand-inner">
              <div className="flex flex-wrap gap-2 pt-2">
                {hidden.map((o) => (
                  <Chip key={o} label={o} active={selected.includes(o)} onClick={() => onToggle(o)} />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleExpanded}
            className="flex items-center gap-1 text-xs font-medium mt-2 transition-opacity hover:opacity-75"
            style={{ color: "var(--text-secondary)" }}
          >
            {expanded ? "Show fewer" : `Show ${hidden.length} more`}
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

function NeighborhoodPicker({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [query, setQuery] = useState("");

  const popular = POPULAR_NEIGHBORHOODS.filter((n) => options.includes(n));
  const trimmed = query.trim().toLowerCase();
  const matches = trimmed
    ? options.filter((n) => n.toLowerCase().includes(trimmed)).slice(0, 8)
    : [];

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((n) => (
            <button
              key={n}
              onClick={() => onToggle(n)}
              className="flex items-center gap-1.5 text-xs font-medium pl-3 pr-2 py-1 rounded-full transition-opacity hover:opacity-75"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-text)" }}
            >
              {n}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <label htmlFor="neighborhood-search" className="sr-only">Search neighborhoods</label>
      <input
        id="neighborhood-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search neighborhoods..."
        className="search-input w-full rounded-lg px-3 py-2.5 text-sm min-h-[44px] mb-3"
        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)", outline: "none" }}
      />

      {trimmed ? (
        matches.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No matches.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {matches.map((n) => (
              <Chip key={n} label={n} active={selected.includes(n)} onClick={() => onToggle(n)} />
            ))}
          </div>
        )
      ) : (
        popular.length > 0 && (
          <>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Popular</p>
            <div className="flex flex-wrap gap-2">
              {popular.map((n) => (
                <Chip key={n} label={n} active={selected.includes(n)} onClick={() => onToggle(n)} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<RestaurantResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/filters`)
      .then((r) => r.json())
      .then((d) => {
        setNeighborhoods(d.neighborhoods ?? []);
        setCuisines(d.cuisines ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, []);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const cuisineOrigins = cuisines.filter((c) => CUISINE_ORIGINS.has(c));

  async function savePreferencesIfAny() {
    if (selectedNeighborhoods.length === 0 && selectedCuisines.length === 0 && selectedPrice.length === 0) return;
    await fetch("/api/profile/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        neighborhoods: selectedNeighborhoods,
        cuisines: selectedCuisines,
        price: selectedPrice,
      }),
    }).catch(() => {});
  }

  async function finishOnboarding(favoriteRestaurantIds: string[]) {
    setSubmitting(true);
    try {
      await savePreferencesIfAny();
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteRestaurantIds }),
      });
    } catch {
      // proceed regardless -- onboarding shouldn't be able to trap someone
    } finally {
      router.push("/recommendations");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <span className="font-display text-xl" style={{ color: "var(--text)" }}>Locals</span>
        <button
          onClick={() => finishOnboarding([])}
          disabled={submitting}
          className="text-sm font-medium transition-opacity hover:opacity-75 disabled:opacity-50"
          style={{ color: "var(--text-muted)" }}
        >
          Skip for now
        </button>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl mb-2" style={{ color: "var(--text)" }}>
          A few quick things
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>
          This helps us show you better picks right away, instead of waiting for you to save a bunch of restaurants first. All of it is optional, and changeable anytime from your profile.
        </p>

        <section className="mb-10">
          <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>Cuisines you like</h2>
          {loadingOptions ? (
            <div className="skeleton h-10 w-full rounded-full" />
          ) : (
            <ExpandableChipGroup
              options={cuisineOrigins}
              selected={selectedCuisines}
              onToggle={(c) => toggle(selectedCuisines, setSelectedCuisines, c)}
              expanded={showAllCuisines}
              onToggleExpanded={() => setShowAllCuisines((v) => !v)}
            />
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>Typical price range</h2>
          <div className="flex flex-wrap gap-2">
            {PRICE_TIERS.map((p) => (
              <Chip key={p} label={p} active={selectedPrice.includes(p)} onClick={() => toggle(selectedPrice, setSelectedPrice, p)} />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>Neighborhood preferences</h2>
          {loadingOptions ? (
            <div className="skeleton h-10 w-full rounded-full" />
          ) : (
            <NeighborhoodPicker
              options={neighborhoods}
              selected={selectedNeighborhoods}
              onToggle={(n) => toggle(selectedNeighborhoods, setSelectedNeighborhoods, n)}
            />
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Favorite NYC restaurants</h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Optional — a few places you already love.</p>
          <RestaurantPicker selected={favorites} onChange={setFavorites} />
        </section>

        <button
          onClick={() => finishOnboarding(favorites.map((f) => f.restaurant_id))}
          disabled={submitting}
          className="cta-btn px-6 py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Finish"}
        </button>
      </main>
    </div>
  );
}
