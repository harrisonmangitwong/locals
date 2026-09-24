"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantPicker from "@/components/RestaurantPicker";
import Chip from "@/components/Chip";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const PRICE_TIERS = ["$", "$$", "$$$", "$$$$"];

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
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<RestaurantResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
            <div className="flex flex-wrap gap-2">
              {cuisines.map((c) => (
                <Chip key={c} label={c} active={selectedCuisines.includes(c)} onClick={() => toggle(selectedCuisines, setSelectedCuisines, c)} />
              ))}
            </div>
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
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {neighborhoods.map((n) => (
                <Chip key={n} label={n} active={selectedNeighborhoods.includes(n)} onClick={() => toggle(selectedNeighborhoods, setSelectedNeighborhoods, n)} />
              ))}
            </div>
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
