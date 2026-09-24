"use client";

import type { CSSProperties } from "react";

const MAX_PRICE = 100;
const STEP = 5;
const DEFAULT_PRICE = 40;

interface PriceSliderProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function PriceSlider({ value, onChange }: PriceSliderProps) {
  const shown = value ?? DEFAULT_PRICE;
  const pct = Math.min(100, (shown / MAX_PRICE) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {value === null ? "No preference set" : shown >= MAX_PRICE ? "$100+ per person" : `~$${shown} per person`}
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
      <div className="flex justify-between mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>$0</span>
        <span>$100+</span>
      </div>
    </div>
  );
}
