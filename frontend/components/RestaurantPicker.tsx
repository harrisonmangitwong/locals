"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Icon from "@/components/Icon";
import { getPhotoUrl } from "@/lib/photoFallback";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface RestaurantResult {
  restaurant_id: string;
  name: string;
  neighborhood: string;
  cuisine: string;
  image_url?: string;
}

interface RestaurantPickerProps {
  selected: RestaurantResult[];
  onChange: (selected: RestaurantResult[]) => void;
}

export default function RestaurantPicker({ selected, onChange }: RestaurantPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RestaurantResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/recommendations?search=${encodeURIComponent(query)}&page_size=6`);
        const d = await res.json();
        setResults(d.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  function addRestaurant(r: RestaurantResult) {
    if (selected.some((s) => s.restaurant_id === r.restaurant_id)) return;
    onChange([...selected, r]);
    setQuery("");
    setResults([]);
  }

  function removeRestaurant(id: string) {
    onChange(selected.filter((s) => s.restaurant_id !== id));
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((r) => (
            <button
              key={r.restaurant_id}
              type="button"
              onClick={() => removeRestaurant(r.restaurant_id)}
              aria-label={`Remove ${r.name}`}
              className="filter-pill is-active h-11 pl-1.5 pr-3 text-[15px] font-medium inline-flex items-center gap-2"
            >
              <span className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                <Image src={r.image_url || getPhotoUrl(r.cuisine)} alt="" fill sizes="32px" className="object-cover" />
              </span>
              {r.name}
              <Icon name="x" size={14} />
            </button>
          ))}
        </div>
      )}

      <label htmlFor="restaurant-picker-search" className="sr-only">Search for a restaurant</label>
      <input
        id="restaurant-picker-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a restaurant"
        className="search-field w-full h-11 rounded-full px-4 text-[15px]"
      />

      {query.trim() && (
        <div className="mt-2 flex flex-col" aria-live="polite">
          {searching && (
            <p className="px-1 py-2.5 text-[15px]" style={{ color: "var(--text-secondary)" }}>Searching…</p>
          )}
          {!searching && results.length === 0 && (
            <p className="px-1 py-2.5 text-[15px]" style={{ color: "var(--text-secondary)" }}>No matches.</p>
          )}
          {!searching && results.map((r) => (
            <button
              key={r.restaurant_id}
              type="button"
              onClick={() => addRestaurant(r)}
              className="w-full flex items-center gap-3 px-2 py-2 -mx-0 rounded-xl text-left transition-colors hover:bg-[var(--bg-subtle)]"
            >
              <span className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: "var(--bg-inset)" }}>
                <Image src={r.image_url || getPhotoUrl(r.cuisine)} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>{r.name}</span>
                <span className="text-[13px] truncate" style={{ color: "var(--text-secondary)" }}>{r.neighborhood} · {r.cuisine}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
