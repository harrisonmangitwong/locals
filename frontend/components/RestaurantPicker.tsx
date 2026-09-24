"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
              onClick={() => removeRestaurant(r.restaurant_id)}
              className="flex items-center gap-1.5 text-xs font-medium pl-1 pr-2 min-h-[44px] rounded-full transition-opacity hover:opacity-75"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-text)" }}
            >
              <span className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                <Image src={r.image_url || getPhotoUrl(r.cuisine)} alt="" fill sizes="20px" className="object-cover" />
              </span>
              {r.name}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
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
        placeholder="Search for a restaurant..."
        className="search-input w-full rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text)", border: "1px solid var(--border)", outline: "none" }}
      />

      {query.trim() && (
        <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {searching && (
            <div className="px-3 py-2.5 text-sm" style={{ color: "var(--text-muted)" }}>Searching…</div>
          )}
          {!searching && results.length === 0 && (
            <div className="px-3 py-2.5 text-sm" style={{ color: "var(--text-muted)" }}>No matches.</div>
          )}
          {!searching && results.map((r) => (
            <button
              key={r.restaurant_id}
              onClick={() => addRestaurant(r)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:opacity-75"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              <span className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                <Image src={r.image_url || getPhotoUrl(r.cuisine)} alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{r.name}</span>
                <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{r.neighborhood} · {r.cuisine}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
