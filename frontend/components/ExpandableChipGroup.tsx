"use client";

import { useEffect, useRef, useState } from "react";
import Chip from "./Chip";
import Icon from "./Icon";

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
      {label && <p className="text-[13px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{label}</p>}
      <div ref={containerRef} className={`chip-collapse${expanded ? " open" : ""}`}>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <Chip key={o} label={o} active={selected.includes(o)} onClick={() => onToggle(o)} />
          ))}
        </div>
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 min-h-[44px] -ml-2 px-2 mt-1 rounded-full text-[14px] font-medium transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ color: "var(--text-secondary)" }}
        >
          {expanded ? "Show fewer" : "Show more"}
          <Icon name="chevron-down" size={14} className={`transition-transform duration-200${expanded ? " rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
