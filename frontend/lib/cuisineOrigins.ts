// The dataset's `cuisine` field also includes meal formats (Brunch, Cafe), dish
// focuses (Pizza, Ramen), and dietary tags (Vegan, Halal) alongside actual
// cuisines, plus a meaningless "Restaurant" catch-all. Preference pickers only
// ask about cuisine proper -- filtering to this set is what makes it a
// coherent, answerable question instead of a mixed-bag one.
export const CUISINE_ORIGINS = new Set([
  "American", "Caribbean", "Chinese", "French", "Greek", "Indian", "Italian",
  "Japanese", "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Peruvian",
  "Thai", "Vietnamese",
]);
