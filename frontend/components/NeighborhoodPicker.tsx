"use client";

import { useState } from "react";
import Chip from "./Chip";
import Icon from "./Icon";

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
              type="button"
              onClick={() => onToggle(n)}
              aria-label={`Remove ${n}`}
              className="filter-pill is-active h-11 pl-4 pr-3 text-[15px] font-medium inline-flex items-center gap-1.5"
            >
              {n}
              <Icon name="x" size={14} />
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
        placeholder="Search neighborhoods"
        className="search-field w-full h-11 rounded-full px-4 text-[15px] mb-3"
      />

      {trimmed ? (
        matches.length === 0 ? (
          <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>No matches.</p>
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
            <p className="text-[13px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Popular</p>
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
