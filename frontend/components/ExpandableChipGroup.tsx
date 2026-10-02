"use client";

import { useEffect, useRef, useState } from "react";
import Chip from "./Chip";

// Matches .chip-collapse's collapsed max-height in globals.css -- one row of chips.
const CHIP_COLLAPSE_HEIGHT = 52;

export default function ExpandableChipGroup({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      setOverflowing(el.scrollHeight > CHIP_COLLAPSE_HEIGHT + 1);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [options]);

  if (options.length === 0) return null;

  return (
    <div className="mb-5 last:mb-0">
      {label && <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>}
      <div ref={containerRef} className={`chip-collapse${expanded ? " open" : ""}`}>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <Chip key={o} label={o} active={selected.includes(o)} onClick={() => onToggle(o)} />
          ))}
        </div>
      </div>
      {overflowing && (
        <button
          onClick={onToggleExpanded}
          className="flex items-center gap-1 text-xs font-medium mt-2 transition-opacity hover:opacity-75"
          style={{ color: "var(--text-secondary)" }}
        >
          {expanded ? "Show fewer" : "Show more"}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
