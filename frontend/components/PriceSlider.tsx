"use client";

import type { CSSProperties } from "react";

const MAX_PRICE = 100;
const STEP = 5;

interface PriceSliderProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function PriceSlider({ value, onChange }: PriceSliderProps) {
  // Render at the empty/left end when unset, so the track's fill never implies
  // a value that was never actually chosen -- the label is the only thing
  // that should say "unset," not a half-filled track contradicting it.
  const shown = value ?? 0;
  const pct = Math.min(100, (shown / MAX_PRICE) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[15px] font-medium tabular-nums" style={{ color: value === null ? "var(--text-secondary)" : "var(--text)" }}>
          {value === null ? "No preference" : shown >= MAX_PRICE ? "$100+ a person" : `About $${shown} a person`}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={MAX_PRICE}
        step={STEP}
        value={shown}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Typical price per person"
        className="price-slider"
        style={{ "--slider-pct": `${pct}%` } as CSSProperties}
      />
      <div className="flex justify-between mt-1.5 text-[13px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
        <span>$0</span>
        <span>$100+</span>
      </div>
    </div>
  );
}
