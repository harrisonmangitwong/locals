export const ARCHETYPES = {
  "Hidden Gem": {
    description: "Rated exceptionally by locals — but almost nobody's discovered it yet.",
    color: "var(--warm)",
    bg: "var(--warm-soft)",
  },
  "Universally Loved": {
    description: "Rated exceptionally by locals — and everyone else already knows it too.",
    color: "var(--accent-text)",
    bg: "var(--accent-soft)",
  },
  "Local Favorite": {
    description: "Solidly good. Locals vouch for it.",
    color: "var(--success)",
    bg: "var(--success-soft)",
  },
} as const;

export type Archetype = keyof typeof ARCHETYPES;

export function isArchetype(value: string | null | undefined): value is Archetype {
  return !!value && value in ARCHETYPES;
}
