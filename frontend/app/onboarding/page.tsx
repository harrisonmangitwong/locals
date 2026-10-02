"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantPicker from "@/components/RestaurantPicker";
import PriceSlider from "@/components/PriceSlider";
import ExpandableChipGroup from "@/components/ExpandableChipGroup";
import NeighborhoodPicker from "@/components/NeighborhoodPicker";
import { CUISINE_ORIGINS } from "@/lib/cuisineOrigins";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface RestaurantResult {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  image_url?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<RestaurantResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [optionsLoadError, setOptionsLoadError] = useState(false);
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/filters`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load filters");
        return r.json();
      })
      .then((d) => {
        setNeighborhoods(d.neighborhoods ?? []);
        setCuisines(d.cuisines ?? []);
      })
      .catch(() => setOptionsLoadError(true))
      .finally(() => setLoadingOptions(false));
  }, []);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const cuisineOrigins = cuisines.filter((c) => CUISINE_ORIGINS.has(c));

  async function savePreferencesIfAny() {
    if (selectedNeighborhoods.length === 0 && selectedCuisines.length === 0 && selectedPrice === null) return;
    const res = await fetch("/api/profile/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        neighborhoods: selectedNeighborhoods,
        cuisines: selectedCuisines,
        price: selectedPrice,
      }),
    });
    if (!res.ok) throw new Error("Failed to save preferences");
  }

  async function finishOnboarding(favoriteRestaurantIds: string[]) {
    setSubmitting(true);
    setSaveError(null);
    try {
      await savePreferencesIfAny();
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteRestaurantIds }),
      });
      if (!res.ok) throw new Error("Failed to complete onboarding");
      // Brief acknowledgment before handing off -- Finish shouldn't feel like
      // a form submitting into silence.
      setJustFinished(true);
      setTimeout(() => router.push("/recommendations"), 700);
    } catch {
      setSubmitting(false);
      setSaveError("Couldn't save your picks, but you can set these anytime from your profile.");
    }
  }

  // Skip is the unconditional exit -- it never blocks on the network, so a
  // failed save can never trap someone here. Best-effort save happens
  // silently in the background; Finish is the path that surfaces failures.
  function handleSkip() {
    savePreferencesIfAny().catch(() => {});
    fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoriteRestaurantIds: [] }),
    }).catch(() => {});
    router.push("/recommendations");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <span className="font-display text-xl" style={{ color: "var(--text)" }}>Locals</span>
        <button
          onClick={handleSkip}
          className="inline-flex items-center min-h-[44px] px-2 text-sm font-medium transition-opacity hover:opacity-75 active:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          Skip for now
        </button>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl mb-2" style={{ color: "var(--text)" }}>
          A few quick things
        </h1>
        <p className="text-base mb-10" style={{ color: "var(--text-muted)" }}>
          This helps us show you better picks right away, instead of waiting for you to save a bunch of restaurants first. All of it is optional, and changeable anytime from your profile.
        </p>

        {optionsLoadError && (
          <p className="text-sm mb-6" style={{ color: "var(--accent)" }}>
            Couldn&apos;t load cuisine and neighborhood options — try refreshing the page.
          </p>
        )}

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
          <PriceSlider value={selectedPrice} onChange={setSelectedPrice} />
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
          {justFinished ? "All set — taking you there…" : submitting ? "Saving…" : "Finish"}
        </button>
        {saveError && (
          <p className="text-sm mt-3" style={{ color: "var(--accent)" }}>{saveError}</p>
        )}
      </main>
    </div>
  );
}
