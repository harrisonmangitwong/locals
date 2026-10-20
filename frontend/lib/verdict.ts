// The plain-language locals-vs-tourists line shown on restaurant pages and
// on "Help me pick" results.
export function getVerdict(localRating: number, touristRating: number): string {
  const gap = localRating - touristRating;
  const l = localRating.toFixed(1);
  const t = touristRating.toFixed(1);
  if (gap > 0.5) return `Locals rate it ${l}, tourists ${t}. Regulars love it more than visitors do.`;
  if (gap > 0.3) return `Locals give it ${l}, noticeably higher than tourists’ ${t}. A neighborhood favorite.`;
  if (gap < -0.3) return `Tourists give it ${t} and locals ${l}. Popular with visitors, and locals still rate it well.`;
  return `Locals (${l}) and tourists (${t}) agree. It holds up across the board.`;
}
