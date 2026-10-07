// The plain-language locals-vs-tourists line shown on restaurant pages and
// on "Help me pick" results.
export function getVerdict(localRating: number, touristRating: number): string {
  const gap = localRating - touristRating;
  if (gap > 0.5) return `Locals rate it ${localRating.toFixed(1)} vs. tourists' ${touristRating.toFixed(1)} — regulars love it more than visitors do.`;
  if (gap > 0.3) return `Locals give it ${localRating.toFixed(1)} — noticeably higher than tourists' ${touristRating.toFixed(1)}. A neighborhood favorite.`;
  if (gap < -0.3) return `Tourists give it ${touristRating.toFixed(1)}, locals ${localRating.toFixed(1)} — popular with visitors, but locals still rate it well.`;
  return `Locals (${localRating.toFixed(1)}) and tourists (${touristRating.toFixed(1)}) agree — this place holds up across the board.`;
}
