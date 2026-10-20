"use client";

import { type CSSProperties, useEffect, useState } from "react";
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
      setSaveError("Couldn't save your picks. You can set them anytime from your profile.");
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
        className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-[19px] font-bold tracking-[-0.025em]">Locals</span>
        <button
          onClick={handleSkip}
          className="min-h-[44px] px-3 -mr-3 rounded-full text-[15px] font-medium transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ color: "var(--text-secondary)" }}
        >
          Skip for now
        </button>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-10">
        <h1 className="font-display text-[34px] md:text-[44px] rise" style={{ "--i": 0 } as CSSProperties}>A few quick things</h1>
        <p className="text-[17px] leading-relaxed mt-3 max-w-[52ch] rise" style={{ color: "var(--text-secondary)", "--i": 1 } as CSSProperties}>
          So your first picks fit you, not just whatever&rsquo;s popular. Everything here is optional, and you can change it anytime from your profile.
        </p>

        {optionsLoadError && (
          <p role="alert" className="text-[15px] mt-6" style={{ color: "var(--text)" }}>
            Couldn&rsquo;t load cuisines and neighborhoods. Try refreshing the page.
          </p>
        )}

        <section className="mt-10 rise" style={{ "--i": 2 } as CSSProperties} aria-labelledby="ob-cuisines">
          <h2 id="ob-cuisines" className="text-[17px] font-semibold mb-3">Cuisines you like</h2>
          {loadingOptions ? (
            <div className="skeleton h-11 w-full rounded-full" />
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

        <section className="mt-9 rise" style={{ "--i": 3 } as CSSProperties} aria-labelledby="ob-price">
          <h2 id="ob-price" className="text-[17px] font-semibold mb-3">Typical price</h2>
          <PriceSlider value={selectedPrice} onChange={setSelectedPrice} />
        </section>

        <section className="mt-9 rise" style={{ "--i": 4 } as CSSProperties} aria-labelledby="ob-hoods">
          <h2 id="ob-hoods" className="text-[17px] font-semibold mb-3">Neighborhoods</h2>
          {loadingOptions ? (
            <div className="skeleton h-11 w-full rounded-full" />
          ) : (
            <NeighborhoodPicker
              options={neighborhoods}
              selected={selectedNeighborhoods}
              onToggle={(n) => toggle(selectedNeighborhoods, setSelectedNeighborhoods, n)}
            />
          )}
        </section>

        <section className="mt-9 rise" style={{ "--i": 5 } as CSSProperties} aria-labelledby="ob-favs">
          <h2 id="ob-favs" className="text-[17px] font-semibold">Places you already love</h2>
          <p className="text-[15px] mt-1 mb-3" style={{ color: "var(--text-secondary)" }}>A few favorites, so we know your taste.</p>
          <RestaurantPicker selected={favorites} onChange={setFavorites} />
        </section>
      </main>

      {/* The one action stays in reach, like the bottom bar in Help me pick. */}
      <div className="sticky bottom-0 w-full" style={{ backgroundColor: "var(--bg)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-3">
          {saveError && (
            <p role="alert" className="text-[13px] mb-2 text-center" style={{ color: "var(--text)" }}>{saveError}</p>
          )}
          <button
            onClick={() => finishOnboarding(favorites.map((f) => f.restaurant_id))}
            disabled={submitting}
            className="cta-btn w-full md:w-auto md:min-w-[240px] px-8 text-[16px] disabled:opacity-40"
          >
            {justFinished ? "All set, taking you there…" : submitting ? "Saving…" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
