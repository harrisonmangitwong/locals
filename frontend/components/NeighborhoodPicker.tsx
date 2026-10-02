"use client";

import { useState } from "react";
import Chip from "./Chip";

// The 10 neighborhoods with the most restaurants in the live dataset --
// one-tap picks for people who don't want to type, computed from
// backend/data.csv rather than guessed.
const POPULAR_NEIGHBORHOODS = [
  "West Village", "East Village", "Williamsburg", "Midtown", "Lower East Side",
  "Flushing", "Greenpoint", "Chelsea", "Murray Hill", "Upper East Side",
];

export default function NeighborhoodPicker({
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
              className="flex items-center gap-1.5 text-xs font-medium pl-3 pr-2 min-h-[44px] rounded-full transition-opacity hover:opacity-75"
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
