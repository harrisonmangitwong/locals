// Mirrors backend/main.py's price_ranges -- used only to translate a numeric
// price preference into the nearest $/$$/$$$/$$$$ tier for the /recommendations
// filter, which still filters by tier. The preference itself is stored as a
// real number; this mapping exists solely for that one bridging purpose.
const PRICE_TIER_RANGES: { tier: string; max: number }[] = [
  { tier: "$", max: 15 },
  { tier: "$$", max: 30 },
  { tier: "$$$", max: 60 },
  { tier: "$$$$", max: Infinity },
];

export function numericPriceToTier(value: number): string {
  return (PRICE_TIER_RANGES.find((r) => value <= r.max) ?? PRICE_TIER_RANGES[PRICE_TIER_RANGES.length - 1]).tier;
}
